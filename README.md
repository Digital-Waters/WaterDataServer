# WaterDataServer
Where all the water monitoring devices send their data to. The server will collect, organize, store, analyze, and share data collected from water monitoring devices in the field.

This code isn't much more than simple data collection and storage. All image data is stored in Amazon S3 storage, links to the actual images are in our Heroku Postgres database. This Python code properly stores incoming data from water monitoring devices into the appropriate locations for further processing.

# Using Our API
There are currently two publicly available APIs:

**https://water-watch-58265eebffd9.herokuapp.com/upload/**
This is the API all our devices will use to submit collected data. It is a POST call and expects the following parameters: 
* deviceID
    The unique device ID. Typically the Raspberry Pi serial number.
    This is a string value.
* latitude
    This latitude of the device. 
    This is a string value.
* longitude
    This longitude of the device.
    This is a string value.
* device_datetime
    The datetime on the device when this image was taken. 
    This is a string value.
* weather
    Depreciated. Will be removed
    This is a string value.
* waterColor
    This is the RGBA value calculated by analyzing the image taken. It is returned in the following format:
    [115.18011543 109.41173712  58.26233262 118.        ]
    Where the first number corresponds to the red value of the water color (from 0-255). The next number maps to the green value, the 3rd number to the blue value, and the 4th number to the alpha value. 
    This is a string value.
* image
    This is a JPEG image collected by the device camera.
    This is a file object. 

**https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/**
This is the API used to GET all our collected water data. We have many devices uploading data at different times, always. This API is the way we and the public will access all our water data.
This API call will be used to power our main site map / appication, as well as any other 3rd party integrations. 

This call can be made as is to return all data. We will soon limit the max number of records returned and introduce some form of paging. 
It can also use optional parameters to filter out the data by time, location, or deviceIDs:

* begin_longitude
* begin_latitude
* end_longitude
* end_latitude
    The begin and end coordinate pairs are meant to be used to describe a bounding geographical box between two points. Think of these as opposite corners on a rectangle.
    These are float data types
    Example: "-92.484848234"
* begin_datetime
    The specific datetime you'd like your data set to begin at. All data uploaded before this point will be excluded.
    This is a datetime type
    Example: "2024-08-26 16:50:03"
* end_datetime
    The specific datetime you'd like your data set to end at. All data uploaded after this point will be excluded.
    This is a datetime type
    Example: "2024-09-26 16:50:03"
* DeviceIDs: Optional[List[str]] = Query(None)
    A list of deviceIDs to pull data from. Any devices that don't have these IDs will be excluded. This is useful for organizations responsible for many devices.
    This is a list of strings.
    Example: "0000000035a0f031"
