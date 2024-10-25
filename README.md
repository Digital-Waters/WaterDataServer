# WaterDataServer
Where all the water monitoring devices send their data to. The server will collect, organize, store, analyze, and share data collected from water monitoring devices in the field.

This code isn't much more than simple data collection and storage. All image data is stored in Amazon S3 storage, links to the actual images are in our Heroku Postgres database. This Python code properly stores incoming data from water monitoring devices into the appropriate locations for further processing.

# Using Our API

**Sending Datetimes**

Some APIs have optional datetime parameters. These are actual datetime objects and to send them via https, we use the ISO 8601 format for sending datetimes as strings. We specifically use the ISO8601 Date (extend) format: https://dencode.com/en/date/iso8601

Use the above URL to encode your detetimes into a format our API can consume. 

## Images table
This is where all device data is stored and is the backbone of our organization. We have two API calls to access this data: one to upload, and one to get.

### upload

**https://water-watch-58265eebffd9.herokuapp.com/upload/**

This is the API all our devices will use to submit collected data. It is a POST call and expects the following parameters: 

* `deviceID`
    - The unique device ID. Typically the Raspberry Pi serial number.
    This is a string value.
* `latitude`
    - The latitude of the device. Unless the device has a GPS, this will come from the device record or be manually updated by someone.
    This is a float value.
* `longitude`
    - This longitude of the device.
    This is a float value.
* `temperature`
    - The temperature outside the electronics enclosure, in celcius. Higher values are likely to mean temperature capture in a room-temperature climate. Water temperatures in Canada don't usually exceed 15 degress celcius.
    This is a float value.
* `device_datetime`
    - The datetime on the device when this image was taken. This is local time without timezone information. See note above on datetimes. 
    This is a datetime value.
* `weather`
    - Depreciated. Will be removed
    This is a string value.
* `waterColor`
    - This is the RGBA value calculated by analyzing the image taken. It is returned as a dictionary with r, g, b, a keys as in:
    `{r: 123, b: 234, g: 82, a: 22}`
    Each number is a value between 0-255. 
    This is a dictionary value sent as a string.
* `image`
    - This is a JPEG image collected by the device camera.
    This is a file object. 

### getwaterdata

**https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/**

This is the API used to GET all our collected water data. We have many devices uploading data at different times, always. This API is the way we and the public will access all our water data.
This API call will be used to power our main site map / appication, as well as any other 3rd party integrations. 

This call will always return a maximum of 1000 records per call. But you can page through the data by using the optional `limit` and `offset` parameters

It can also use optional parameters to filter out the data by time, location, or deviceIDs:

* `begin_longitude`
* `begin_latitude`
* `end_longitude`
* `end_latitude`
    - The begin and end coordinate pairs are meant to be used to describe a bounding geographical box between two points. Think of these as opposite corners on a rectangle.
    These are float data types
    Example: `-92.484848234`
* `begin_datetime`
    - The specific datetime you'd like your data set to begin at. All data uploaded before this point will be excluded. See note above on datetimes. 
    This is a datetime type 
    Example: `2024-10-22T15:02:21.242-05:00`
* `end_datetime`
    - The specific datetime you'd like your data set to end at. All data uploaded after this point will be excluded. See note above on datetimes. 
    This is a datetime type
    Example: `2024-10-22T15:02:21.242-05:00`
* `max_temperature`
    - The maximum temperature you want your data to have, in celcius. Any recoreds with a higher temperature will be ignore.
    This is a float type
    Example: `max_temperature=12`
* `deviceIDs`
    - A list of deviceIDs to pull data from. Any devices that don't have these IDs will be excluded. This is useful for organizations responsible for many devices.
    This is a list of strings.
    Example: `deviceIDs=0000000077de649d&deviceIDs=000000002133dded`

**Example calls:**
Get all records from one of two devices that have a maximum temperature of 12, was created after Oct 2, 2024, limit the results to 25, but the second set of 25 in the results (i.e.: from 26-50):

https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/?max_temperature=18&begin_datetime=2024-10-02T15:02:21.242-05:00&deviceIDs=0000000077de649d&deviceIDs=000000002133dded&limit=25&offset=25

Get the latest 400 results from one device:

https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/?deviceIDs=000000002133dded&limit=400

## Devices Table
All our water data comes from devices. Devices are physical things that our people maintain. As we are currently not using GPS with our monitoring devices, we rely on volunteers to determine the precise longitude and latitude of where they place each of their devices. We will use the device location information for all the data that comes from the device.

### getwaterdevice

**https://water-watch-58265eebffd9.herokuapp.com/getwaterdevice**

This is a GET call to get all our devices.

This call will always return a maximum of 1000 records per call. But you can page through the data by using the optional `limit` and `offset` parameters
It can also use optional parameters to filter out the data by time, location, or deviceIDs:

* `begin_longitude`
* `begin_latitude`
* `end_longitude`
* `end_latitude`
    - The begin and end coordinate pairs are meant to be used to describe a bounding geographical box between two points. Think of these as opposite corners on a rectangle.
    These are float data types
    Example: `-92.484848234`
* `lastCleaned_datetime`
    - The last datetime the device was cleaned. This isn't currently actively maintained. All data uploaded after this point will be excluded. See note above on datetimes. 
    This is a datetime type 
    Example: `2024-10-22T15:02:21.242-05:00`
* `deviceIDs`
    - A list of deviceIDs to pull data from. Any devices that don't have these IDs will be excluded. This is useful for organizations responsible for many devices.
    This is a list of strings.
    Example: `deviceIDs=0000000077de649d&deviceIDs=000000002133dded`

**Example Calls:**

To get the details on a given device

https://water-watch-58265eebffd9.herokuapp.com/getwaterdevice/?deviceIDs=000000002133dded
