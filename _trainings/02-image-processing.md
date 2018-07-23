---
title: "Image Processing"
---

## Image Collections

  Yesterday, we touched a little bit on Image Collections. Image Collections
are a collection of images. They're kind of like a big sack that holds a bunch
of images. Image collections can be filtered, so that certain images are excluded
based on things like location, time, or metadata (such as quality). Image collections
can be mapped. When we map over a collection, we use a single function to change
every single image in the collection. Image collections can be reduced, where
every image in the collection is flattened into a single image.

  In this script, we will load an image collection. Then we will filter
the image collection, selecting only those images that are within
a certain geometry and within a certain time period. Then, we will map over the
image collection, masking out any pixels that are cloudy. Finally, we will
reduce the image collection, and take a mosaic or median of the collection.
  We will:
  * define a region of interest. This will be a rectangle in Park W.
  * Use .filterBounds to select only those images within the region.
  * Use .filterDates to select only those images within 2017.
  * Add our collection of images to the map.

Load Landsat 8 collection. Just like an ee.Image, and ee.ImageCollection is created using an asset id.
~~~
var ls8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')

// Create a polygon in the Park W. We use ee.Geometry.Rectangle. We give it a list
// of coordinates. The first two are for the bottom-left. The second two are the
// coordinates for the top-right.
var aoi = ee.Geometry.Rectangle(
  [
    // Coordinates for the botom-left
    2.2, 11.9,
    // Coordinates for the top-right
    2.5, 12.2
  ]
)

// Add the geometry to the map.
Map.addLayer(aoi, {}, 'AOI')

// Select Landsat scenes within the geometry. We will use .filterBounds.
// .filterBounds takes a geometry, and only returns those scenes that intersect
// that geometry.
var filteredImages = ls8
  .filterBounds(aoi)

// Your image collection should contain <<NUMBER>>
print('After filtering bounds, collection size', filteredImages.size())
print('Expected Size:', 341)


// Select scenes from 2017. We will use the .filterDates method. .filterDates
// takes two dates, in the form of strings. The first date is the start date.
// The second date is the end date. Only scenes between these dates will remain
// in the collection. Dates are in the format 'YYYY-MM-DD'.
filteredImages = filteredImages
  .filterDate('2017-01-01', '2017-12-31')

// Your image collection should contain 64 images
print('After filtering date, collection size:', filteredImages.size())
print('Expected Size:', 64)

/*
    Every Landsat scene has a 'CLOUD_COVER' property. This represents the percentage
  of the scene that is covered in clouds. We will filter out scenes that are covered
  by 40% clouds or greater. .filter() takes as a property an ee.Filter object.
  You can read more about the filters in the Docs tab. We are going to use the
  filter ee.Filter.lt('CLOUD_COVER', 0.4). Images only pass the filter if their
  'CLOUD_COVER' property is less than 0.4.
*/
filteredImages = filteredImages
  .filter(ee.Filter.lt('CLOUD_COVER', 0.4))

print('After filtering date, collection contains:', filteredImages.size())
print('Expected Size:', 19)



// Add the image collection to the map.
Map.addLayer(filteredImages, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'processed image collections')
print(filteredImages)
/*
  Mapping an image collection
    When we map an image collection, we use a function to modify every element in
  that collection. We provide the .map() collection with a function. The function
  must take an image as its input, and return a new image. Typically, we use map
  to do something like calculating NDVI for every image in a collection,
  getting statistics for every image in a collection, or masking every image in
  a collection for clouds.

  In this example, we will map a collection for clouds, so that every image will
  have its clouds masked. First, we must create a function that will mask our
  images. To determine what is clouds and what is not, we will use a built-in
  Earth Engine function, called ee.Algorithms.Landsat.simpleCloudScore(). This
  takes a Landsat TOA image and returns the same image, with a new band, 'cloud',
  that represents the cloudiness of this pixel. More information about .simpleCloudScore()
  is available in the Docs tab.

  Once we have an image with information about how cloudy each pixel is, we will
  create a mask where pixels of a certain cloudiness are masked. Finally, we will
  return our masked image.
*/

// So we create our maskClouds function
var maskClouds = function(image) {
  // We want to run the image through the ee.Algorithms.Landsat.simpleCloudScore().
  // This gives the percent chance that the pixel is a cloud.
  image = ee.Algorithms.Landsat.simpleCloudScore(image)

  // Now we can create a mask. .lte() (think, Less Than or Equal) returns an image
  // where each pixel is 0 if it fails the test, and 1 if it passes. So in the
  // mask image, each pixel will be 1 if it is less than or equal to 0.5, or
  // 0 if it is greater than 0.5.

  // We want to create the cloud mask, from the 'cloud' band, so we select that
  // band from the image.
  var cloudMask = image.select('cloud')
  cloudMask = image.lte(0.5)
  // We now apply that mask to the image, using .updateMask().
  image = image.updateMask(cloudMask)
  return image
}

// Let's see how our masked collection looks.
var maskedImages = filteredImages.map(maskClouds)
Map.addLayer(maskedImages, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'Masked Collection')

/*
  Compositing and mosaicking
    We now have a collection of images, which we have filtered and masked
  for clouds. We would now like to turn that collection of images into a single
  image. This will make it easier to analyze or export our information.

  There are two techniques that we will look at for turning an image collection into a
  single image. One is mosaicking, and the other is compositing.

  Mosaicking
    There are two ways that we can mosaic in Earth Engine. We use the .mosaic() function on
  a collection, and Earth Engine will mosaic our masked images, giving preference to
  more recent images.

  We can also use .qualityBand('bandName'). This will order the pixels by the band name
  that we pass.
*/

// Mosaic an image
var mosaickedImage = maskedImages.mosaic()
Map.addLayer(mosaickedImage, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'Mosaicked Image')

// Quality mosaic an image
var qualityMosaickedImage = maskedImages.qualityMosaic('cloud')
Map.addLayer(qualityMosaickedImage, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'Quality Mosaicked Image')

/*
  Compositing
    Another way that we can turn a collection into a single image is by using
  compositing. We might take the min, the median, the max or the mean value
  of a pixel. There are corresponding methods to composite a collection (ie,
  .min(), .max(), .median(), .mean() ). You can read more in the Docs tab. Right
  now, let's take the median value.
*/

// Composite an image
var compositedImage = maskedImages.median()
Map.addLayer(compositedImage, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'Composited Image')

// Take a moment to try out other ways of compositing, like .mean(), .min(), .max().

/*
  Clipping an Image
    You can see that our coposited image is much larger that our AOI. We would like
  to clip the image to our original AOI. We can clip an image by using the clip function.
  When we use .clip(), we pass the geometry that we would like to clip an image to.
  We can only use .clip on an image, not on an image collection. If we had tried to use
  this function on our collection before compositing, it would have given an error.
*/
var clippedImage = compositedImage.clip(aoi)
Map.addLayer(clippedImage, {min: 0, max: 0.3, bands:'B4,B3,B2'}, 'Clipped Image')

/*
  We have now successfully processed a Landsat collection into a single image.
  We have:
    * Created an ee.ImageCollection variable that refers to the Landsat 8 Tier 1 TOA collection.
    * Filtered that collection, limiting scenes based on date, on location, and on cloud coverage.
    * Mapped over that collection, to mask cloudy pixels.
    * Composited or mosaicked that collection of images into a single image.
    * Clipped that composite image to our original area of interest.
*/

/*
  Optional: Chaining function calls
    Up to this point, we have been assigning the returned value of each function
  to a new variable, and passing that new variable to the next function, and so on.
  It is possible, however, for us to directly pass the results of each function
  to the next, without having to declare a new variable. The result of the functions
  is exactly the same: we only do this because it is easier to read and easier to write.

  When we chain together function calls, we do it by putting a . between the methods.
  For example, we could write:
  var collection = ls8.filterBounds(aoi).filterDate('2016-01-01', '2016-12-31')

  Furthermore, we can put a line break between function calls that we have chained
  together in this way. Below is our function rewritten so that all of the function
  calls are chained together.
*/

var chainedImage = ls8.filterBounds(aoi)
  .filterDate('2017-01-01', '2017-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 0.4))
  .map(maskClouds)
  .median()
  .clip(aoi)

Map.addLayer(chainedImage, {min:0, max:0.3, bands:'B4,B3,B2'}, 'chained image')
~~~
{:. .source .language-javascript}
