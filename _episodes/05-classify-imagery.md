---
title: "Classifying Satellite Imagery"
teaching: 0
exercises: 0
questions:
- "How do I perform supervised classification of satellite imagery?"
- "How do I assess the accuracy of my classifier?"
- "How do I create my own geometries manually?"

objectives:
- "Practice finding cloud-free imagery and using hand-drawn geometry imports "
- "Learn the basic functions necessary to train and apply a classification algorithm"
- "Evaluate training accuracy using a confusion matrix"

keypoints:
- "GEE can be used for both supervised and unsupervised image classification."
- "The general workflow for classification includes gathering training data, creating a classifier, training the classifier, classifying the image, and then estimate error with an independent validation dataset."
- "Confusion matrices can be used to assess the accuracy of supervised classifiers but should be used with caution."
---


## Classifiers Overview

We're almost there! We've got our training set, we've got our testing set, and we're ready to train a classifier. We're going to create an `ee.Classifier()`, and use the training set to train it. Then, we're going to use that classifier to classify the testing set and check its accuracy using `.confusionMatrix()`.

## Setup
Let's load our training and testing sets from our last episode.
```
// Load workshop tools and Atlas V1 data
var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var renderClassification = workshopTools.renderClassification
var atlas_2013 = workshopTools.atlas_2013
var zoneGeometries = workshopTools.zoneGeometries
var getSeasons = workshopTools.getSeasons
var landsatCollection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
var maskLandsatImage = workshopTools.maskLandsatImage
var sampleCollection = workshopTools.sampleCollection
var trainTestSplit = workshopTools.trainTestSplit

// Create our Landsat image
var aoi = zoneGeometries[789]
var timeFilter = getSeasons(2013).get(4)
var landsatImage = landsatCollection
  .filterBounds(aoi)
  .filter(timeFilter)
  .map(maskLandsatImage)
  .median()

  var samplingPoints = getCenterPoints(aoi, atlas_2013)

var partitions = trainTestSplit(samplingPoints, 0.7)
var trainingPoints = partitions[0]
var testingPoints = partitions[1]

var trainingData = sampleCollection(landsatImage, atlas_2013, trainingPoints)
var testingData = sampleCollection(landsatImage, atlas_2013, testingPoints)
```

## How does supervised classification work?

The Atlas V2 dataset was produced using the process of _supervised classification_. With supervised classification, We give a classifier a set of training data with labeled classes. The classifier, using different mathematical techniques, 'learns' the relationship between the training features and the labeled class. The classifier can then label new data that it has not seen before.

Supervised classifiers are mplemented in Earth Engine as `ee.Classifier` objects. A number of classifiers implemented in Earth Engine, including perceptrons, support vector machines, and naive Bayes. For the Atlas V2 project, we went with a random forest classifier. A random forest consists of a set of decision trees. The decision trees are not all allowed to learn on all of the features, forcing them to be different from one another and resulting in a more robust and accurate classifier. To make a classification, the trees all 'vote' on whether they think that a given sample belongs to a class. Classification is done in a one-vs-all manner. For every class the model has learned, the trees all vote on whether they think that the sample belongs to the class. Whichever class has the highest percentage of votes 'wins' the classification.

We chose a random forest for a number of reasons. They are a simple classifier that is quick for Earth Engine to calculate. The inputs for the random forest do not need to be normalized, as is the case for many other machine learning methods. The random forest does not need to undergo hyperparameter tuning, as is the case for Support vector machines, which can be very time consuming. Random forests are also fairly robust, and are resistant to noisy or irrelevant training features.



## Training a Classifier

We're going to initialize a classifier, of the type `ee.Classifier`. There are a number of classifiers available in Earth Engine, including `naiveBayes`, `decisionTree`, and `svm`. For our classifier, we're going to use `randomForest`, because it does well on our data set both in terms of speed and accuracy. I would invite you to experiment with other machine learning techniques, however.

### Creating a Classifier

So, the first thing to do is to create a classifier:

Here, we're telling EE we want a random forest classifier, and we want it to have 20 trees per class. Although Earth Engine will give an error if a training takes to long or uses too many resources, generally more trees are better. Only up to a point, however. At a certain point, only better training features can improve accuracy.

Twenty is a pretty good number.
```
var classifier = ee.Classifier.randomForest(20)
```

There are a number of parameters that we can pass when we set up this classifier, but for now, the only one parameter that we're going to set is the number of trees per class. We're telling Earth Engine that we want to use 2 trees per class. With a random forest classifier, more trees results in higher accuracy (up to a point). We're only using two trees because of the limitations that Earth Engine imposes; when we export the resulting image later on we will switch to more trees.

### Training a Classifier

We train a classifier by passing it a feature collection. We describe which field is the label (ie, the class that we're trying to predict) and which fields we want to use as the features predicting that class.

```
classifier = classifier.train(trainingData, 'b1', trainingBands)
```

### Classifying an Image

We have a trained classifier; let's use it to classify an image. We have our collection ofLlandsat images from earlier; let's composite that into one image by taking the `.median()` value and classify it with `.classify()`.

```
var classifiedImage = landsatImage
  .classify(classifier)

renderClassification(classifiedImage, 'classifiedImage')
```
<img src="../fig/05-rough-niamey-classification.png" border = "10">

## Exporting an Image

Now that we have our classified image, we would like to export it so that we can use it outside of Earth Engine. We can do this by exporting the image to Google Drive.

```
// Export a classified Image

Export.image.toDrive({
  image: classifiedImage,
  folder: 'classifiedLulc',
  region: aoi,
  fileNamePrefix: 'classifiedLulc2013',
  scale: 30,
  description: 'classifiedLulc2013',
  maxPixels: 1e13
});
```

Congrats! You've successfully created a land cover classification. Broadly speaking, that's more or less the process that you're going to use for just about everything: create a training set, use it to train a classifier, use that classifier to classify an image.

### Assessing Accuracy

Take a moment to switch to the Satellite base map, and look around our classified image, switching back and forth between the satellite base map and our classified image. How well does our classified image do? It seems like there are a few places that are clearly inaccurate: the south back of the city, for example, is classified as water, rather than settlement. But how can we quantitatively assess the accuracy of our classifier? We could check its accuracy on the training set, but that wouldn't tell us very much, because the classifier has already seen that data. We want to know how well it's going to do on data that it's never seen before, so we will use the testing data:

```
var errorMatrix = testingData
  .classify(classifier)
  .errorMatrix('b1', 'classification')

var testingAccuracy = errorMatrix.accuracy()

print('testingAccuracy', testingAccuracy)
```
<img src="../fig/05-low-testing-accuracy.png" border = "10">

55% accuracy: not bad, but not great. Let's break down those numbers a little bit more. One thing that we can do is look at the error matrix. The error matrix, which is a confusion matrix, is an N x N array where the rows represent the actual values and the columns represent the predicted values. [Read a little bit more about confusion matrices here](https://en.wikipedia.org/wiki/Confusion_matrix):
<img src="../fig/05-error-matrix.png" border="10">

```
print(errorMatrix)
```

What we'd really like to do is get the accuracy per land cover class. This is called the Producer's Accuracy, which we get using `.producersAccuracy()`. We've got a little problem, however: Earth Engine's `ConfusionMatrix` expects that classes are going to be contiguous integers, but our classes are non-contiguous integers. We need a way to distinguish between classes that have 0% accuracy because the classifier failed to classify any of them correctly and classes that have 0% accuracy becase they were not present in the testing set. To do this, we're going to:
* Create a list of the land cover classes present in the testing dataset.
    * To get the list of land cover classes, we're going to:
        1. Get the `.aggregate_histogram()` of the land cover band (`'b1'`)
        1. Convert the resulting object to an `ee.Dictionary`
        1. Take the keys of that dictionary.
* Create the producer's accuracy and convert it to a list.
    * The output of `.producersAccuracy()` is a 1-dimensional array. To convert this to a list that we can work with, we will need to reproject it to a 0-dimensional array.
* Select from that list the elements that are present in the testing dataset by index.
    * The classes in the list of classes will be strings, so we need to convert them to `ee.Number`s using `ee.Number.parse()`
* Zip together the land cover class numbers and the accuracies into a dictionary.

```
// Get the classes present in the testing set
var testingClasses = testingData.aggregate_histogram('b1')
testingClasses = ee.Dictionary(testingClasses).keys()

print('testingClasses', testingClasses)

// Take the producers accuracy, and reproject it from a 1-dimensional matrix
// into 0 dimensions, and then convert it into a list.
var producersAccuracy = errorMatrix.producersAccuracy().project([0]).toList()
print('producersAccuracy', producersAccuracy)
var accuracyByClass = testingClasses.map(function(classId) {
  return producersAccuracy.get(ee.Number.parse(classId))
})

accuracyByClass = ee.Dictionary.fromLists(testingClasses, accuracyByClass)

print('accuracyByClass', accuracyByClass)
```

Now let's roll that all together into a function.

```
function getAccuracyByClass(testingData, classProperty) {
  testingData = ee.FeatureCollection(testingData)
  // Get the classes present in the testing set
  var testingClasses = testingData.aggregate_histogram(classProperty)
  testingClasses = ee.Dictionary(testingClasses).keys()

  // Take the producers accuracy, and reproject it from a one dimensional matrix
  // into 0 dimensions, and then convert it into a list.
  var producersAccuracy = errorMatrix.producersAccuracy().project([0]).toList()
  var accuracyByClass = testingClasses.map(function(classId) {
    return producersAccuracy.get(ee.Number.parse(classId))
  })

  return ee.Dictionary.fromLists(testingClasses, accuracyByClass)
}
```

<!-- # Classifying Different Years

So far we've only classified images from the same year as when the classifier was produced. But, we can classify from different years, too. So long as a dataset has data available for one of the years that Atlas was produced (1975, 2000, 2013), we can create a classifier that will work on other images from a remote sensing dataset.

For example, let's create an image for 2014, and have our classifier classify that.

```
// Load Landsat 7 Collection
var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

// Select an area of interest for Niamey
var aoi = zoneGeometries[789]

// Get time filter
var timeFilter2014 = getEarlyDrySeason(2014)

// Filter Landsat Collection
var landsatImages2014 = landsat7Collection
  .filterBounds(aoi)
  .filter(timeFilter2014)
  .map(maskLandsatImage)

print('landsatImages', landsatImages)

Map.addLayer(landsatImages, {min:0, max:3000, bands: ['B3', 'B2', 'B1']})
``` -->


# Improving our Classifier

We've now gone through the whole process from start to finish. We can now:

* Create training inputs
* Sample training inputs
* Train a classifier
* Classify images
* Assess the performance of our classifier
