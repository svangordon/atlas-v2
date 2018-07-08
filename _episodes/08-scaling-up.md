---
title: "Improving Data Inputs"
teaching: 0
exercises: 0
questions:
- How do I create a time series for a given location?
- How can I plot that time series within Google Earth Engine?
- "How do I make that plot interactive?"
objectives:
- "Load high resolution crop imagery."
- "Dynamically select lat/longs for creating time series plots."
- "Create a time series of NDVI and EVI for a selected point."
keypoints:
- "Time series data can be extracted and plotted from Image Collections for points and regions."
- "GEE has increasing functionality for making interactive plots."
- "The User Interface can be modified through the addition of widget."

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

```
/*
  Select the geometries that we would like to classify. In this case, we're going
  to classify every zone in Senegal.
*/

// Load feature collection of country boundaries
var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')
// Select our contry of interest
var countryOfInterest = "SENEGAL"
var aoiSelector = countryBoundaries.filter(ee.Filter.eq('name', countryOfInterest))

// Create our list of zones
var areasOfInterest = ee.FeatureCollection(zoneGeometries)
  .filterBounds(aoiSelector)

// Display our areas of interest on the map.
Map.addLayer(areasOfInterest)
```

To define our classification years, let's just write them all out by hand. If we had a lot of years, we might do something like `var classificationYears = ee.List.sequence(startYear, endYear)`, but sometimes it's nice to have objects on the client side instead of on the server side.
```
var classificationYears = [2001, 2004, 2007, 2010, 2013, 2016]
```

### Creating an input collection
Using our areas of interest and our classification years, we are going to create a feature collection where the geometry of each feature is an area of interest and each feature has a `classificationYear` property. Then, when we want to run all of our export tasks, we will iterate over this collection.

To create our collection of areas of interest and years, we are going to map over our collection of AOIs. At each AOI, we will take our list of classification years, and convert it to a feature collection by combining each with the AOI geometry. This results in a collection of collections, which we will finally flatten.

When we export our images, we will need a way to keep each zone distinct; earth engine assets must al have unique names. So we'll also add a random column to our AOIs, which we will convert to a random integer between 0 and 100000.

```
function getAoiYearPairs(areasOfInterest, yearsOfInterest) {
  return ee.FeatureCollection(areasOfInterest)
    .randomColumn('aoiNumber')
    .map(function(aoi) {
      var yearAoiPairs =  ee.List(classificationYears)
        .map(function(yearOfInterest) {
          // We need a way to differentiate our AOIs when we export them. So, we take
          // the random number that we added earlier, and convert it to an integer
          var aoiNumber = ee.Number(aoi.get('aoiNumber')).multiply(100000).toInt()
          return aoi
            .set('year', yearOfInterest)
            .set('aoiNumber', aoiNumber)
        })
      return ee.FeatureCollection(yearAoiPairs)
    })
    .flatten()
}

print(getAoiYearPairs(areasOfInterest, classificationYears))
```


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


```
function getImage(classificationAoi, year) {
  var satelliteCollection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

  // Create our temporal filters
  // March 15 to May 15
  var earlyTemporalFilter = getSeasons(year).slice(1,2)
  // September 15 to November 15
  var lateTemporalFilter = getSeasons(year).slice(4,5)

  // Create our Landsat image for the first part of the year
  var earlyLandsatImage = satelliteCollection
    .filterBounds(classificationAoi)
    .filter(earlyTemporalFilter)
    .map(maskLandsatImage)
    .median()
    // .clip(classificationAoi)

  // Create our Landsat image for the later part of the year
  var lateLandsatImage = satelliteCollection
    .filterBounds(classificationAoi)
    .filter(lateTemporalFilter)
    .map(maskLandsatImage)
    .median()
    // .clip(classificationAoi)

  // Create DEM data, and add calculated bands
  var demData = ee.Algorithms.Terrain(ee.Image("USGS/SRTMGL1_003"))
    // .clip(classificationAoi)

  return earlyLandsatImage
    .addBands(lateLandsatImage)
    .addBands(demData)
}

```

Let's test our function:
```
Map.addLayer(getImage(zoneGeometries[43], 2013), {bands: "B3, B2, B1", min:0, max:3000})
```

### Create a classify and export function

#### Classify

#### Export
We will begin by exporting our images as Earth Engine assets.
