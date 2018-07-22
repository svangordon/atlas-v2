---
title: "Classifying at Scale"
teaching: 0
exercises: 0
questions:
- How do we perform classifications for large numbers of images?
objectives:
- Create a pipeline for classifying images.
- Automatically begin classifications as batch jobs.
keypoints:
- Batch jobs can be executed automatically using by using the browser console.

---

## Overview

So far, we've seen how to classify one or two years of data in one or two zones. However, what we're really interested in is classifying large areas of data over large periods of time. We will now discuss some ways to automatically perform many classification tasks.

At the end of this lesson, you will know how to classify and export multiple years of data for multiple regions, and will be able to run those exports automatically.

We will look at:
* Creating a classify-and-export function
* Assembling the year and zone parameters for our classifications
* Automatically running image exports

<br>

Our process will be as follows: We will create a function that takes as its parameters an area of interest and a year. That function will complete the entire image classification process that we have laid out in previous lessons: assembling training data, training a classifier, classifying an image, etc. That function will create a batch job to export the classified image. We will then assemble a list of areas of interest and years of interest. We will loop over the years and areas and provide them to the classify-and-export function, thereby creating the export jobs needed. Finally, we will execute the batch jobs, either by using automated methods, or by manually executing them.

## Assemble inputs

We will be automatically running classification on a number of zones and for a number of years. First, however, we need to determine what zones we want to classify and for what years. We're going to do this by selecting a subsection of our classification geometries, and by manually defining a list of years that we are interested in. For demonstration purposes, we're going to classify all of the zones in Senegal, with one classification performed every three years.

### Assembling classification geometries

Using the LSIB collection, let's load the boundaries of Senegal.
~~~
/*
  Select the geometries that we would like to classify. In this case, we're going
  to classify every zone in Senegal.
*/

// Load feature collection of country boundaries
var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')
// Select our contry of interest
var countryOfInterest = "SENEGAL"
var aoiBoundary = countryBoundaries.filter(ee.Filter.eq('name', countryOfInterest))
Map.addLayer(aoiBoundary)
~~~
{:. .source .language-javascript}

Now let's define the function to get the list of classification zones for that geometry of interest.
~~~
var zoneSize = 56000
function getClassificationZone(pointGeometry, zoneSize) {
  pointGeometry = ee.FeatureCollection(pointGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
  var atlasProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: atlasProjection,
      scale: zoneSize,
      geometry: pointGeometry,
      geometryInNativeProjection: true
    })
}
~~~
{:. .source .language-javascript}

Now, let's create our collection of classification zones, and add it to the map.
~~~
var classificationZones = getClassificationZone(aoiBoundary, zoneSize)

Map.addLayer(classificationZones)
~~~
{:. .source language-javascript}

### Assembling classification years
To define our classification years, let's just write them all out by hand. If we had a lot of years, we might do something like `var classificationYears = ee.List.sequence(startYear, endYear)`, but sometimes it's nice to have objects on the client side instead of on the server side.
~~~
var classificationYears = [2001, 2004, 2007, 2010, 2013, 2016]
~~~
{:. .source language-javascript}

### Creating an input collection
Using our areas of interest and our classification years, we are going to create a feature collection where the geometry of each feature is an area of interest and each feature has a `classificationYear` property. Then, when we want to run all of our export tasks, we will iterate over this collection.

To create our collection of areas of interest and years, we are going to map over our collection of AOIs. At each AOI, we will take our list of classification years, and convert it to a feature collection by combining each with the AOI geometry. This results in a collection of collections, which we will finally flatten.

When we export our images, we will need a way to keep each zone distinct; earth engine assets must have unique names.

~~~
function getAoiYearPairs(areasOfInterest, yearsOfInterest) {
  return ee.FeatureCollection(areasOfInterest)
    .map(function(aoi) {
      var yearAoiPairs =  ee.List(classificationYears)
        .map(function(yearOfInterest) {
          return aoi
            .set('year', yearOfInterest)
        })
      return ee.FeatureCollection(yearAoiPairs)
    })
    .flatten()
}

print(getAoiYearPairs(classificationZones, classificationYears))
~~~
{:. .source .language-javascript}

## Classify-and-export Function

Our `classifyAndExport()` function will take as inputs a year and a zone that we want classified. We're going to hard code the classification process, but that's alright -- it will be easy enough for us to change later. In terms of internal structure, we're going to:

* Get a training image from 2013
* Sample the training image
* Use the training data to train a classifier
* Get an image for the classification year
* Use the classifier to classify the classification year
* Export the classified image

You'll notice that there are two places where we're getting an image: we get both a training image and a classification image. Let's write a function called `getImage` that gets our image for us, so that we don't have to repeat ourselves.

### Get image
Throughout the previous units, we have been discussing the ways to construct inputs for our classifications. For our `getImage` function, we're going to put a couple of those together. For this example, we will use a single season of Landsat 7 data with DEM data added.

Let's copy and paste in our `maskLandsat` function from earlier.
~~~
function maskLandsat(image) {
  // Bits 0, 3, 4 and 5 are fill, cloud shadow, snow, and cloud.
  var fillBit = ee.Number(2).pow(0).int()
  var cloudShadowBit = ee.Number(2).pow(3).int()
  var snowBit = ee.Number(2).pow(4).int()
  var cloudBit = ee.Number(2).pow(5).int()

  // Get the pixel QA band.
  var qa = image.select('pixel_qa')

  var radsatMask = image
    .select('radsat_qa')
    .eq(0)

  var mask = radsatMask
    .and(qa.bitwiseAnd(cloudShadowBit).eq(0))
    .and(qa.bitwiseAnd(fillBit).eq(0))
    .and(qa.bitwiseAnd(snowBit).eq(0))
    .and(qa.bitwiseAnd(cloudBit).eq(0))
    // .and(image.select('sr_atmos_opacity').lte(300))

  return image
    .updateMask(mask)
    .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])
}
~~~
{:. .source .language-javascript}

~~~
function getImage(classificationAoi, year) {
  classificationAoi = ee.Geometry(classificationAoi)
  var satelliteCollection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

  // Create our temporal filters
  var lateYearFilter = Filter.or(
    ee.Filter.date( year - 1 + '-09-15',  year - 1 + '-11-15'),
    ee.Filter.date( year     + '-09-15',  year     + '-11-15'),
    ee.Filter.date( year + 1 + '-09-15',  year + 1 + '-11-15')
  )

  // Create our Landsat image for the later part of the year
  var lateLandsatImage = satelliteCollection
    .filterBounds(classificationAoi)
    .filter(lateTemporalFilter)
    .map(maskLandsatImage)
    .median()

  // Create DEM data, and add calculated bands
  var demData = ee.Algorithms.Terrain(ee.Image("USGS/SRTMGL1_003"))

  return lateLandsatImage
    .addBands(demData)
    .clip(classificationAoi)
}
~~~
{:. .source .language-javascript}

Let's test our function:
~~~
Map.addLayer(getImage(classificationZones.first(), 2013), {bands: "B3, B2, B1", min:0, max:3000})
~~~

## Create a classify and export function
Now, we will create a function that will map over all of our year-zone pairs and classify them.

We begin our function, and cast the  `yearZonepair` to a feature.
~~~
function classifyImage(yearZonePair) {
  yearZonePair = ee.Feature(yearZonePair)
~~~
{:. .source .language-javascript}

We keep track of the `yearZonePair`'s index so that we can later on calculate the zone id and year. `system:index` is just an element's position in a collection.
~~~
  var classificationIndex = yearZonePair.get('system:index')
~~~
{:. .source .language-javascript}

And then we read the year and the geometry off of the yearZonePair.
~~~
  var classificationYears = ee.List(yearZonePair.get('years'))
  var classificationAoi = yearZonePair.geometry()
~~~
{:. .source .language-javascript}

We now begin to train our classifier. We are going to use 2013 as the year for our training.
~~~
  var trainingYear = 2013
  var labelImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
~~~
{:. .source .language-javascript}

We create our training image using the `getImage` function that we defined earlier.
~~~
  var trainingImage = getImage(classificationAoi, trainingYear).addBands(labelImage)
~~~
{:. .source .language-javascript}

We create the sampling points for our zone.
~~~
  var zonePoints = getPoints(classificationAoi)
~~~
{:. .source .language-javascript}

We sample our training image.
~~~
  var zoneData = trainingImage
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: zonePoints,
      scale: 30,
      projection: zonePoints.geometry().projection()
    })
    .map(toPoint)
    .randomColumn('trainTestSplit', 0)
~~~
{:. .source .language-javascript}

We split our data into training and testing sets.
~~~
  var trainingSize = 0.7
  var trainingData = zoneData.filter(ee.Filter.lt('trainTestSplit', trainingSize))
  var testingData = zoneData.filter(ee.Filter.gte('trainTestSplit', trainingSize))
~~~
{:. .source .language-javascript}

We train our classifier and assess its accuracy.
~~~
  var classifier = ee.Classifier.randomForest(10).train(trainingData, 'b1', landsatBands)
  var testingAccuracy = testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy()
~~~
{:. .source .language-javascript}

Now, we are going to map over our list of years, and for each year, we will create an image that we will classify with the classifier. We will also set the testing accuracy of the classifier as a property on the image.
~~~
  var classifiedImages = classificationYears.map(function(classificationYear) {
    // Get collection of images that we are going to classify
    var classificationImage = getImage(classificationAoi, classificationYear)

    var classifiedImage = classificationImage.classify(classifier)
      .set('testingAccuracy', testingAccuracy)
    return classifiedImage
  })
~~~
{:. .source .language-javascript}

Now we return that collection of classified images.
~~~
  return classifiedImages
}
~~~
{:. .source .language-javascript}

Now we use that `classifyImage` function to map over the collection of year-zone pairs.
~~~
var classifiedImages = yearZonePairs.map(classifyImage).flatten()
~~~
{:. .source .language-javascript}

## Exporting Classified Images
We now want to export all of these classified images as batch jobs. One problem is that when 
