---
title: "Transition Statistics"
teaching: 0
exercises: 0
questions:
- How can I see information about transitions between classes?
objectives:
- Create a transition matrix (or a set of transition stats)
keypoints:
- Transition matrices can be created using an `.errorMatrix`
- Transition matrices can also be created by 'packing' values
---

Last episode, we talked about how we can get information about areas of different classes in the AtlasV2 dataset. This episode, we will discuss more advanced statistics: specifically, we are going to look at extracting more complex information from the images, specifically information about transitions between classes.

## Transition Matrices
Because of the high temporal resolution of AtlasV2, we are able to get more meaningful information about the transitions between classes. Using AtlasV2, we can see not only that certain classes are growing or shrinking in area, but we can also see which classes are transitioning into other classes. For example, we can see that Short-grass Savanna is the class most commonly converted into agriculture.

## A more Academic Description of Transition Matrices
Transition matrices are also known as stochastic matrices. Stochastic matrices are used to describe the transitions of a Markov chain. That's basically treating the land cover system sort of like a state machine, which is actually pretty cool.

## Process Overview
To create our transition matrix, we are going to associate the image from each year in the AtlasV2 collection with the image from the year after. So we will combine the image from 2000 with the image from 2001, the image from 2001 from the image with 2002, and so forth.
~~~
[2000, 2001],
[2001, 2002],
...
[2015, 2016]
~~~
Each of these images then has information about each pixel's class in the earlier year, as well as its class in the later year. By sampling these images, we can learn whether pixels remained the same class or transitioned to different classes.

## Loading Data
To create transition matrices, we will need to load the AtlasV2 image collection.
~~~
var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
~~~
{:. .source .language-javascript}

Let us also load two years of the data, 2013 and 2014, so that we can test out our process before applying it to the entire collection.
~~~
var atlasV2_2013 = ee.Image('users/svangordon/conference/atlas_v2/classify/2013')
var atlasV2_2014 = ee.Image('users/svangordon/conference/atlas_v2/classify/2014')
~~~
{:. .source language-javascript}

## Sampling Images
One challenge in creating a transition matrix is that the obvious method to sample an image, `.sample()` in unsuited to such a large dataset. For example, if we were to attempt to sample every single pixel in one of our AtlasV2 images at 30m scale, we would be attempting to create a feature collection with somewhere around 4e10 features. That's a big feature collection! Feature Collections are limited to a size of 80mb, so such a large sampling will fail.
~~~
print('sample', atlasV2_2013.addBands(atlasV2_2014).sample({
  scale: 30
}))
~~~
{:. .source .language-javascript}
~~~
FeatureCollection (Error)
  User memory limit exceeded.
~~~
{:. .error}

We can use the `tileScale` property to try and avoid the memory issue. `tileScale` tells Earth Engine to perform the sampling in smaller chunks ((you can read more about tile scale here)[https://developers.google.com/earth-engine/debugging#scaling-errors]). Instead of reducing regions of 256 pixels at once, Earth Engine will reduce smaller areas, which may avoid the user memory error.

~~~
print('sample, scaled', atlasV2_2013.addBands(atlasV2_2014).sample({
  scale: 30,
  tileScale: 4
}))
~~~
{:. .source .language-javascript}
~~~
FeatureCollection (Error)
  Computation timed out.
~~~
{:. .error}

However, it also makes the sampling take longer, and in this case, the sampling method times out. One option is that we could export the results of the sampling as a batch job; feature collection exports are allowed up to two hours, which might be enough time. But, it would be really convenient if we didn't have to do an export.

You may notice that the `.reduceRegion()` reduction still works. Is there a way that we can use a reduction to extract transition statistics?

## Packing Transition Values

Using raster math, we can create images where the value of each pixel reflects its class in the two years, and then take the histogram of that image.

Class values are two digit numbers (ie, integers 1 - 99). Because of this, if we multiply Year 1 by 100 and add Year 2, the values of the resulting image will be a four digit number where the first two digits represent the class in Year 1 and the second two digits represent the class in Year 2. We will call the resulting value the _transition value_. The _transition from_ class is equal to the remainder of the transition value divided by 100. The _transition to_ class is equal to the floored (rounded down) result of the transition value divided by 100.

> ## Why 100?
>
> Why is 100 the number we multiply and divide by? What number would we use if our classes were 0 - 9? What class would we use if our highest class was 600?
{:. .challenge}

So, we first create the packed image by multiplying the 2013 image by 100 and adding the 2014 image.
~~~
var packedImage = atlasV2_2013.multiply(100).add(atlasV2_2014)
~~~
{:. .source .language-javascript}

We then take the frequency histogram of the packed image, just as we did when we were calculating class areas.
~~~
var packedHistogram = packedImage.reduceRegion({
    reducer: ee.Reducer.frequencyHistogram(),
    scale: 30,
    maxPixels: 1e13
  })
print('packedHistogram', packedHistogram)
~~~
{:. .source .language-javascript}
~~~
packedHistogram
Object (1 property)
  b1: Object (445 properties)
    1002: 527
    1003: 3683
    1004: 11976396
    1006: 278
    1007: 2543
    1008: 14686
    1009: 3325
    ...
~~~
{:. .output}

## Unpacking Transitions
We will now convert our histogram of transition values into a feature collection.

Our pixels are all 30m, so we have the same conversion coefficient.
~~~
var conversionCoefficient = 0.0009
~~~
{:. .source .language-javascript}

So we take the `b1` property of the histogram, and cast it to a dictionary.
~~~
var transitionCollection = ee.Dictionary(packedHistogram.get('b1'))
~~~
{:. .source .language-javascript}

Then we map over the resulting dictionary. The function we pass to `.map()` iterates over every key-value pair, and takes the key and the value as its parameters.
~~~
  .map(function(transitionValue, pixelCount) {
~~~
{:. .source .language-javascript}

First we convert our pixel count to an area, same as we did for the basic statistics.
~~~
    var transitionArea = ee.Number(pixelCount).multiply(conversionCoefficient)
~~~
{:. .source .language-javascript}

Then we calculate the `transitionFrom` class. This is the first two digits of the `transitionValue`, which we calculate as the result of floored division of the `transitionValue` by 100.
~~~
    var transitionFrom = ee.Number.parse(transitionValue).divide(100).floor()
~~~
{:. .source .language-javascript}

Now we calculate the `transitionTo` class. This is the remainder (ie, modulus dividend) of the `transitionValue` divided by 100.
~~~
    var transitionTo = ee.Number.parse(transitionValue).mod(100)
~~~
{:. .source .language-javascript}

We now create a feature using those values and return it.
~~~
    var transitionFeature = ee.Feature(null, {
      'transitionFrom': transitionFrom,
      'transitionTo': transitionTo,
      'transitionAreaKm': transitionArea
    })
    return transitionFeature
  })
~~~
{:. .source .language-javascript}

We then take the `.values` of the dictionary and cast it to a collection.
~~~
  .values()

transitionCollection = ee.FeatureCollection(transitionCollection)
~~~
{:. .source .language-javascript}

We can now display and export our collection of transition information.
~~~
print('transitionCollection', transitionCollection)

Export.table.toDrive({
  collection: transitionCollection,
  folder: "eeExports",
  fileFormat: "CSV",
  description: "transitionCollection2013to2014"
});
~~~
{:. .source .language-javascript}

## Transition Statistics for Multiple Years
Now that we have created transition statistics using two images (2013 and 2014), we would like to explore creating transition statistics with multiple years. We want to process a collection of year pairs beginning in 2000 and ending in 2015, meaning we can map over a list of the numbers `[2000 - 2015]` and use those numbers to construct dates. We will use the same process for calculating transition stats as we outlined above.

So, we will create the `ee.List` of numbers that we will map over.
~~~
var transitionStats = ee.List.sequence(2000, 2015)
  .map(function(year) {
~~~
{:. .source .language-javascript}

Using the years 2000 to 2015, we create a `fromFilter` (for the year) and a `toFilter` (for the year after).
~~~
    var fromFilter = ee.DateRange(ee.Date.fromYMD(year, 1, 1), ee.Date.fromYMD(year, 12, 31))
    var toFilter = ee.DateRange(ee.Date.fromYMD(year, 1, 1).advance(1, 'year'), ee.Date.fromYMD(year, 12, 31).advance(1, 'year'))
~~~
{:. .souce .language-javascript}

Using those filters, we filter the AtlasV2 collection into a `fromImage` and a `toImage`.
~~~
    var fromImage = ee.Image(atlasV2Collection.filterDate(fromFilter).first())
    var toImage = ee.Image(atlasV2Collection.filterDate(toFilter).first())
~~~
{:. .source .language-javascript}

Now that we have our from and to images, we can pack them together into a transition image and take its histogram.
~~~
    var transitionImage = fromImage.multiply(100).add(toImage)
    var transitionHistogram = transitionImage.reduceRegion({
        reducer: ee.Reducer.frequencyHistogram(),
        scale: 30,
        maxPixels: 1e13
      })
~~~
{:. .source .language-javascript}

Then we unpack that conversion histogram, converting each class transition into a feature.
~~~
    var conversionCoefficient = 0.0009
    var transitionCollection = ee.Dictionary(transitionHistogram.get('b1'))
      .map(function(transitionValue, pixelCount) {
        var transitionArea = ee.Number(pixelCount).multiply(conversionCoefficient)
        var transitionFrom = ee.Number.parse(transitionValue).divide(100).floor()
        var transitionTo = ee.Number.parse(transitionValue).mod(100)
        var transitionFeature = ee.Feature(null, {
          'transitionFrom': transitionFrom,
          'transitionTo': transitionTo,
          'transitionAreaKm': transitionArea,
          'fromYear': year,
          'toYear': ee.Number(year).add(1)
        })
        return transitionFeature
      })
      .values()
    return transitionCollection
  }).flatten()
~~~
{:. .source .language-javascript}

Finally, we cast the resulting features collection. This gives us a collection of class transitions that we can display in the console or export to Drive.
~~~
transitionStats = ee.FeatureCollection(transitionStats)
print('transitionStats', transitionStats)
~~~
{:. .source .language-javascript}
