---
title: "classifyZones Overview"
teaching: 0
exercises: 0
questions:
- How do we make our own choices for `classifyZones`?
objectives:
- Learn how to make our own version of `classifyZones`
keypoints:
- We must save our own version of `classifyZones`
- We make changes in the classifyZones function to use different years, different
label images, and so forth.
---

## Classify Zones

Our classification is done by the function `classifyZones`. This is what you should personalize and change for doing your own classification your own way.

We create a function called `classifyZone`. It takes a geometry that we want to classify as its input.
~~~
function classifyZone(classificationZone) {
~~~
{:. .source .language-javascript}

We want to get a geometry from our classification zone. We cast it to a feature collection (in case it already isn't) and take its geometry.
~~~
  classificationZone = ee.FeatureCollection(classificationZone).geometry()
~~~
{:. .source .language-javascript}

We choose our label image (ie, our image of human classified data). Change `var labelImage = atlas_2013` if you would like to use a different label image. (For example, `var labelImage = atlas_2000`)
~~~
  // Label image: change label image here
  var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
  var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
  var labelImage = atlas_2000
~~~
{:. .source .language-javascript}

We set our training and classification years. These are the years that we will get basemaps for. Training year is used for the basemap that the training data is extracted from. Classification year is used for the basemap that the classification data is extracted from. For example, if we wanted to do a training on 2000 and a classification on 2014, we would set `var trainingYear = 2013` and `var classificationYear = 2014`.
~~~
  // Training and classification years
  var trainingYear = 2013
  var classificationYear = 2016
~~~
{:. .source .language-javascript}

We choose what bands are used to train the classifier. These bands should be appropriate to the image collection we are using. If we were to change to Landsat 8, we would set `var trainingBands = ls7Bands`. If we were to change to another satellite completely (such as Sentinel), we would need to create a new list of bands.
~~~
  // Training bands: the names of the bands that we will classify on
  var ls7Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']
  var ls8Bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B10', 'B11']
  var demBands = ['aspect', 'elevation', 'hillshade', 'slope']
  var trainingBands = ls7Bands
~~~
{:. .source .language-javascript}

Set the name of the class band, ie, what band on the label image contains information about what class is present in each pixel. The class band for all Atlas images is `'b1'`. If we changed to a new set of label images, we would need to change this.
~~~
  var classBand = 'b1'
~~~
{:. .source .language-javascript}

Set what collection of satellite imagery we will use for our basemap. If we wanted to change from Landsat 7 to Landsat 8, we would use `var trainingImageCollection = landsat8Collection;`. If we wanted to use a collection not listed here, we would load it in the same way we usually load image collections.
~~~
  var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  var landsat8Collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  var trainingImageCollection = landsat7Collection;
~~~
{:. .source .language-javascript}

Now, we need to create our training image and classification images. These are the images that we will pair with label data to train the algorithm, and the image that our algorithm will classify, respectively. We have created a function, `getLandsatImage`, that takes the area for which we want to create our basemap(`classificationZone`), a year that we want to create a basemap for (`trainingYear`) and a collection from which we will extract our images (`trainingImageCollection`). If we want to make changes to the way that we get our basemap, we would edit that function, or we would right a new function, and call it instead (for example: `var trainingImage = yourCustomGetBasemapFunction(classificationZone, trainingYear);`)

If you would like to visualize the training image or the classification image, this is the place to do it. You would change this, for the time being, to return the training image.
~~~
  // Set training and classification images
  var trainingImage = getLandsatImage(classificationZone, trainingYear, trainingImageCollection);
  var classificationImage = getLandsatImage(classificationZone, classificationYear, trainingImageCollection);
~~~
{:. .source .language-javascript}

We create a collection of points at which we will sample our basemap. These are to be the points that were classified during the RLCMS process. If we were to change to a non-Atlas dataset, we would use something appropriate to our dataset. For example, we might use `var labelLocations = ee.FeatureCollection.randomPoints(classificationZone)`
~~~
  // Create points that we will sample training image at. If using non-Atlas
  // data, change this to randomPoints
  var labelLocations = getLabelLocations(classificationZone, labelImage)
~~~
{:. .source .language-javascript}

We now pair our training basemap with the label image, and sample it at the label locations. This function is likely to be appropriate for multiple datasets.
~~~
  var inputData = getTrainingInputs(trainingImage, labelImage, labelLocations)
~~~
{:. .source .language-javascript}

Now that we have created our `inputData`, we will train our algorithm. By default, this uses a random forest with 20 trees per class. You can change the algorithm by changing the `trainAlgorithm` function. The `trainAlgorithm` function returns an image, where the image is the result of the algorithm's classification. 
~~~
  // Uses a random forest by default. Change trainAlgorithm function if you
  // would like to adjust that.
  var trainingResult = trainAlgorithm(inputData, trainingBands)
  var algorithm = trainingResult.get('algorithm')
  var accuracy = ee.Image(trainingResult.get('accuracy'))
  algorithm = ee.Classifier(algorithm)
  var classifiedImage = trainingImage.classify(algorithm)
    .set('accuracy', accuracy)

  return classifiedImage
}
~~~
{:. .source .language-javascript}
