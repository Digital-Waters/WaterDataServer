from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, and_, desc, asc, select, delete, cast
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
#from geoalchemy2 import Geometry
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from urllib.parse import urlparse
import boto3
import os


app = FastAPI()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
bucketName = "waterwatch"

# Open up to all domains
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define your database model
class ImageRecord(Base):
    __tablename__ = "images"
    id        = Column(Integer, primary_key=True, index=True)
    deviceID  = Column(String, index=True)
    latitude  = Column(Float, index=True)
    longitude = Column(Float, index=True)
    device_datetime = Column(DateTime, index=True)
    gmt_datetime = Column(DateTime, index=True, nullable=True)
    imageURI  = Column(String)
    temperature = Column(Float, index=True, nullable=True) 
    waterColor = Column(String, nullable=True)
    weather = Column(String, nullable=True) 

# Define your pydantic model for request body
class ImageItem(BaseModel):
    deviceID:  str
    latitude:  float
    longitude: float
    device_datetime:  datetime
    gmt_datetime: datetime
    temperature: float
    waterColor: str
    weather: str

# Pydantic model for response
class ImageResponse(BaseModel):
    id: int
    deviceID: str
    latitude: float
    longitude: float
    device_datetime: datetime
    gmt_datetime: datetime
    imageURI: str
    temperature: float
    waterColor: str
    weather: str

    class Config:
        orm_mode = True


class DeviceRecord(Base):
    __tablename__ = "devices"
    deviceID  = Column(String, primary_key=True, index=True)
    accountOwner = Column(String, index=True)
    latitude  = Column(Float, index=True)
    longitude = Column(Float, index=True)
    lastOnline = Column(DateTime, index=True, nullable=True)
    nearbyGeoCoords = Column(String, index=False, nullable=True)#Column(Geography('LINESTRING'), index=False, nullable=True)
    lastCleaned = Column(DateTime, index=True, nullable=True)

class DeviceItem(BaseModel):
    deviceID: str
    accountOwner: str
    latitude: float
    longitude: float
    lastOnline: datetime
    nearbyGeoCoords: str
    lastCleaned: datetime

class DeviceResponse(BaseModel):
    deviceID:  str
    accountOwner: str
    latitude: float
    longitude: float
    lastOnline: datetime
    nearbyGeoCoords: str
    lastCleaned: datetime

    class Config:
        orm_mode = True
    



# Define route to handle POST requests
@app.post('/upload/')
#async def upload_image(item: ImageItem, image: UploadFile = File(...)):
async def upload_image(deviceID: str = Form(...), 
                      latitude: float = Form(...), 
                      longitude: float = Form(...), 
                      device_datetime: str = Form(...), 
                      temperature: float = Form(...), 
                      waterColor: str = Form(...),
                      weather: str = "n/a",
                      image: UploadFile = File(...)):
    try:
        url = f'https://'+bucketName+'.s3.amazonaws.com/'+image.filename

        # Connect to AWS S3
        s3 = boto3.resource('s3',
            aws_access_key_id=os.getenv("AWS_ACCESS_ID"),
            aws_secret_access_key=os.getenv("AWS_ACCESS_KEY"))

        # Upload image to S3
        s3.meta.client.upload_fileobj(
            Fileobj = image.file,
            Bucket = bucketName,
            Key = image.filename,
            ExtraArgs = {"ContentType":"image/jpeg"},
            Callback = None,
            Config = None)

        Base.metadata.create_all(engine)
        
        # Save image data to Heroku Postgres database with S3 URI
        db = SessionLocal()
        new_image = ImageRecord(
            deviceID=deviceID, 
            latitude=latitude, 
            longitude=longitude, 
            device_datetime=device_datetime, 
            gmt_datetime=datetime.now(),
            imageURI=url,
            waterColor=waterColor,
            temperature=temperature,
            weather="n/a")
        db.add(new_image)
        db.commit()
        db.close()

        return JSONResponse(content={"message": "File uploaded successfully"}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": "Failed to upload file", "error": str(e)}, status_code=500)


# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET method to retrieve data
@app.get('/getwaterdata/', response_model=List[ImageResponse])
async def get_data(
    begin_longitude: Optional[float] = None,
    begin_latitude: Optional[float] = None,
    end_longitude: Optional[float] = None,
    end_latitude: Optional[float] = None,
    begin_datetime: Optional[datetime] = None,
    end_datetime: Optional[datetime] = None,
    max_temperature: Optional[float] = None,
    DeviceIDs: Optional[List[str]] = Query(None),
    limit: int = 1000,
    offset: int = 0
):
    try:
        db = SessionLocal()
        query = db.query(ImageRecord)

        # Build filters
        filters = []
        if begin_longitude is not None:
            filters.append(ImageRecord.longitude >= begin_longitude)
        if end_longitude is not None:
            filters.append(ImageRecord.longitude <= end_longitude)
        if begin_latitude is not None:
            filters.append(ImageRecord.latitude >= begin_latitude)
        if end_latitude is not None:
            filters.append(ImageRecord.latitude <= end_latitude)
        if begin_datetime is not None:
            filters.append(ImageRecord.device_datetime >= begin_datetime)
        if end_datetime is not None:
            filters.append(ImageRecord.device_datetime <= end_datetime)
        if max_temperature is not None:
            filters.append(ImageRecord.temperature <= max_temperature)

        if DeviceIDs:
            valid_ids = [device_id for device_id in DeviceIDs if device_id]
            if valid_ids:
                filters.append(ImageRecord.deviceID.in_(valid_ids))

        # Apply filters and fetch results
        if filters:
            query = query.filter(and_(*filters))
        
        query = query.order_by(desc(ImageRecord.deviceID), desc(ImageRecord.gmt_datetime))

        if limit > 1000: 
            limit = 1000

        # Apply limit and offset for paging
        query = query.offset(offset).limit(limit)

        results = query.all()
        db.close()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# GET method to retrieve data
@app.get('/deleteData/')
async def deleteData(IDtoDelete: int = 0):
    #return JSONResponse(content={"message": "Delete Disabled"}, status_code=200)
    return deleteRowsAndS3Data(IDtoDelete)

def deleteS3Object(s3_url):
    """Delete the corresponding object from S3 based on its URL."""
    parsed_url = urlparse(s3_url)
    object_key = parsed_url.path.lstrip('/')
    
    try:
        s3c = boto3.client('s3',
            aws_access_key_id=os.getenv("AWS_ACCESS_ID"),
            aws_secret_access_key=os.getenv("AWS_ACCESS_KEY"))
        
        s3c.delete_object(Bucket=bucketName, Key=object_key)

        print(f"Deleted S3 object: {object_key}")
        return True

    except Exception as e:
        print(f"Error deleting S3 object: {e}")
        return False

def deleteRowsAndS3Data(IDtoDelete):
    """Delete rows from the Postgres database and their corresponding S3 objects."""
    try:
        db = SessionLocal()
        query = db.query(ImageRecord)

        # Build filters
        filters = []
        #filters.append(ImageRecord.id == IDtoDelete)
        filters.append(ImageRecord.deviceID == "000000002133dded")
        query = query.filter(and_(*filters))
        results = query.all()

        if not results:
            print("No rows found to delete.")
            db.close()
            return

        cnt = 0
        # Validate, delete S3 objects, and remove rows
        for row in results:
            
            # Delete from S3
            if deleteS3Object(row.imageURI) == False:
                print("Unable to delete S3 object. Aborting.")
                return

            # Delete row from database
            db.delete(row)
            print(f"Deleted row with id: {row.id}")
            print(f"Count: {cnt}")
            cnt = cnt + 1
            if cnt > 60:
                break

        # Commit the transaction
        db.commit()
        print("All rows and corresponding S3 objects deleted.")
    
        db.close()

        return JSONResponse(content={"message": "Record deleted successfully"}, status_code=200)

    except Exception as e:
        return JSONResponse(content={"message": "Failed to delete record", "error": str(e)}, status_code=500)
        



# GET method to retrieve data
@app.get('/getwaterdevice/', response_model=List[DeviceResponse])
async def get_device(
    DeviceID: Optional[str] = None, 
    DeviceIDs: Optional[List[str]] = Query(None),
    begin_longitude: Optional[float] = None,
    begin_latitude: Optional[float] = None,
    end_longitude: Optional[float] = None,
    end_latitude: Optional[float] = None,
    lastCleaned_datetime: Optional[datetime] = None,
    limit: int = 1000,
    offset: int = 0
):
    try:
        db = SessionLocal()
        query = db.query(DeviceRecord)

        # Build filters
        filters = []
        if DeviceID is not None:
            filters.append(DeviceRecord.deviceID == DeviceID)
        if DeviceIDs:
            valid_ids = [device_id for device_id in DeviceIDs if device_id]
            if valid_ids:
                filters.append(DeviceRecord.deviceID.in_(valid_ids))
        if begin_longitude is not None:
            filters.append(DeviceRecord.longitude >= begin_longitude)
        if end_longitude is not None:
            filters.append(DeviceRecord.longitude <= end_longitude)
        if begin_latitude is not None:
            filters.append(DeviceRecord.latitude >= begin_latitude)
        if end_latitude is not None:
            filters.append(DeviceRecord.latitude <= end_latitude)
        if lastCleaned_datetime is not None:
            filters.append(DeviceRecord.lastCleaned <= lastCleaned_datetime)

        # Apply filters and fetch results
        if filters:
            query = query.filter(and_(*filters))
        
        query = query.order_by(desc(DeviceRecord.deviceID))

        if limit > 1000: 
            limit = 1000

        # Apply limit and offset for paging
        query = query.offset(offset).limit(limit)

        results = query.all()
        db.close()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
