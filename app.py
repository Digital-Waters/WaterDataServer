from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, and_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import List, Optional
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
    imageURI  = Column(String)
    weather   = Column(String) 
    waterColor = Column(String)

# Define your pydantic model for request body
class ImageItem(BaseModel):
    deviceID:  str
    latitude:  str
    longitude: str
    device_datetime:  str
    weather:   str
    waterColor: str


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
                      weather: str = Form(...), 
                      waterColor: str = Form(...),
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
                         weather=weather)
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
@app.get('/getwaterdata/')
async def get_data(
    begin_longitude: Optional[float] = None,
    begin_latitude: Optional[float] = None,
    end_longitude: Optional[float] = None,
    end_latitude: Optional[float] = None,
    begin_datetime: Optional[DateTime] = None,
    end_datetime: Optional[DateTime] = None,
    DeviceIDs: Optional[List[str]] = Query(None)
):
    try:
        db = SessionLocal()
        # Start building the query
        query = db.query(Item)

        # Apply filters based on optional parameters
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
            filters.append(Item.deviceID.in_(DeviceIDs))
        
        # Apply filters to the query
        if filters:
            query = query.filter(and_(*filters))
        
        # Execute the query and fetch results
        results = query.all()
        db.close()
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))