from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, and_, desc, asc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import boto3
import os


app = FastAPI()

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define your database model
class Item(Base):
    __tablename__ = "images"
    id        = Column(Integer, primary_key=True, index=True)
    deviceID  = Column(String, index=True)
    latitude  = Column(String, index=True)
    longitude = Column(String, index=True)
    device_datetime  = Column(DateTime, index=True)
    gmt_datetime = Column(DateTime, index=True, nullable=True)
    imageURI  = Column(String)
    temperature = Column(String) 
    waterColor = Column(String)
    weather = Column(String, nullable=True) 

# Define your pydantic model for request body
class ImageItem(BaseModel):
    deviceID:  str
    latitude:  str
    longitude: str
    device_datetime:  str
    temperature: str
    waterColor: str
    weather: str

# Pydantic model for response
class ItemResponse(BaseModel):
    id: int
    deviceID: str
    latitude: str
    longitude: str
    device_datetime: datetime
    gmt_datetime: datetime
    imageURI: str
    temperature: str
    waterColor: str
    weather: str

    class Config:
        orm_mode = True

# Connect to AWS S3
s3 = boto3.resource('s3',
    aws_access_key_id=os.getenv("AWS_ACCESS_ID"),
    aws_secret_access_key=os.getenv("AWS_ACCESS_KEY"))

# Define route to handle POST requests
@app.post('/upload/')
#async def upload_image(item: ImageItem, image: UploadFile = File(...)):
async def upload_image(deviceID: str = Form(...), 
                      latitude: str = Form(...), 
                      longitude: str = Form(...), 
                      device_datetime: str = Form(...), 
                      temperature: str = Form(...), 
                      waterColor: str = Form(...),
                      weather: str = "n/a",
                      image: UploadFile = File(...)):
    try:
        
        # create unique S3 file name
        nameElements = [deviceID, device_datetime,'.jpeg']
        s3filename = '_'.join(nameElements)
        bucket_name = "waterwatch"
        url = f'https://'+bucket_name+'.s3.amazonaws.com/'+s3filename

        # Upload image to S3
        s3.meta.client.upload_fileobj(
            Fileobj = image.file,
            Bucket = bucket_name,
            Key = s3filename,
            ExtraArgs = {"ContentType":"image/jpeg"},
            Callback = None,
            Config = None)

        try:
            Base.metadata.create_all(bind=engine)
        except ProgrammingError as e:
            print("Table 'images' already exists.")


        # Save image data to Heroku Postgres database with S3 URI
        db = SessionLocal()
        new_image = Item(deviceID=deviceID, 
                         latitude=latitude, 
                         longitude=longitude, 
                         device_datetime=device_datetime, 
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
@app.get('/getwaterdata/', response_model=List[ItemResponse])
async def get_data(
    begin_longitude: Optional[float] = None,
    begin_latitude: Optional[float] = None,
    end_longitude: Optional[float] = None,
    end_latitude: Optional[float] = None,
    begin_datetime: Optional[datetime] = None,
    end_datetime: Optional[datetime] = None,
    DeviceIDs: Optional[List[str]] = Query(None),
    limit: int = 1000,
    offset: int = 0
):
    try:
        db = SessionLocal()
        query = db.query(Item)

        # Build filters
        filters = []
        if begin_longitude is not None:
            filters.append(Item.longitude >= begin_longitude)
        if end_longitude is not None:
            filters.append(Item.longitude <= end_longitude)
        if begin_latitude is not None:
            filters.append(Item.latitude >= begin_latitude)
        if end_latitude is not None:
            filters.append(Item.latitude <= end_latitude)
        if begin_datetime is not None:
            filters.append(Item.device_datetime >= begin_datetime)
        if end_datetime is not None:
            filters.append(Item.device_datetime <= end_datetime)
        if DeviceIDs:
            valid_ids = [device_id for device_id in DeviceIDs if device_id]
            if valid_ids:
                filters.append(Item.deviceID.in_(valid_ids))

        # Apply filters and fetch results
        if filters:
            query = query.filter(and_(*filters))
        
        query = query.order_by(desc(Item.deviceID), desc(Item.gmt_datetime))

        if limit > 1000: 
            limit = 1000

        # Apply limit and offset for paging
        query = query.offset(offset).limit(limit)

        results = query.all()
        db.close()
        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))