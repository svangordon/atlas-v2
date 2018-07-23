---
title: "Smoothing Zone Boundaries"
teaching: 0
exercises: 0
questions:
- How can I reduce the differences between zones?
- How can I ensure that all classes are represented in the training set?
objectives:
- Create a training dataset that is a mix of a zone and that zone's neighbors.
- Create a training dataset that equally represents all classes within a radius of a zone.
keypoints:
- Adding training points from neighboring zones smooths the boundaries between zones.
- Oversampling minority classes will help ensure that they are represented in the classification.
- It is always important to keep the training and testing sets separate.
---

## Including Neighboring Zones

At this point, we're using a series of classifiers to classify a series of zones. One pitfall with this  method is that there can be discrepencies between two zones. One class might be missing from the training data in a zone, or it might not be present in sufficient numbers for the classifier to be able to learn that class well enough for it to be able classify that class.

You can see an example of the boundary issue in the image below: there is a clear difference in how the classifier on the right and the classifier on the left are classifying the agriculture vs savanna.

<img src="../fig/06-boundary-issue-example.png" boder="10">

This is the down side of using the zone system: our classifiers are more accurate, but they are less able to generalize. However, it is possible for us to 'smooth' these zone boundaries. By sampling the zones around the zone we seek to classify, we can get a more balanced training set, and a more versatile classifier, without a loss in accuracy. Let's look at how we can do this.

First, let's demonstrate the zone boundary issue. We're going to classify the zone next to our area of interest, and look to see if there's a noticeable border between the two zones. First, let's get a zone that neighbors our AOI.

## Setting up Baseline Again
First, let us classify a single zone. We will be using code from previous episodes, which you can access at: <<LINK PUT LINK HERE>>

Let us review the functions that we are setting up here are:
* `getClassificationZone`: Creates a 0.5 degree square that we will perform our classification on.
* `getPoints`: For a classification zone, generates a collection of Atlas pixel centerpoints.
* `toPoint`: For a feature collection, takes each features `longitude` and `latitude` properties and converts them into a geometry.
* `displayClassification`: Takes an image classified in the same scheme as an Atlas image, remaps its classes and displays it on the map.
* `maskLandsat`: Masks a collection of Landsat images for quality.

~~~
function getClassificationZone(pointGeometry, zoneSize) {
  var atlasProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: atlasProjection,
      scale: zoneSize,
      geometry: pointGeometry
    })
}

function getPoints(zoneGeometry) {
  var labelProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      scale: labelProjection.nominalScale()
    })
    .map(function(feature) {
      var centroid = feature.centroid(5)
      return centroid
    })
}

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}

function displayClassification(classificationImage, layerName) {
  // Cast classificationImage to Image
  classificationImage = ee.Image(classificationImage)

  var atlasPalette = [
    "8400a8", // Forest / Forêt
    "8bad8b", // Savanna / Savane
    "000080", // Wetland - floodplain / Prairie marécageuse - vallée inondable
    "ffcc99", // Steppe / Steppe
    "808000", // Plantation / Plantation
    "33cccc", // Mangrove / Mangrove
    "ffff96", // Agriculture / Zone de culture
    "3366ff", // Water bodies / Plans d'eau
    "ff99cc", // Sandy area / surfaces sableuses
    "969696", // Rocky land / Terrains rocheux
    "a87000", // Bare soil / Sols dénudés
    "ff0000", // Settlements / Habitations
    "ccff66", // Irrigated agriculture / Cultures irriguées
    "a95ce6", // Gallery forest and riparian forest / Forêt galerie et formation ripicole
    "d296e6", // Degraded forest / Forêt dégradée
    "a83800", // Bowe / Bowé
    "f5a27a", // Thicket / Fourré
    "ebc961", // Agriculture in shallows and recession / Cultures des bas-fonds et de décrue
    "28734b", // Woodland / Forêt claire
    "ebdf73", // Cropland and fallow with oil palms / Cultures et jachère sous palmier à huile
    "beffa6", // Swamp forest / Forêt marécageuse
    "a6c28c", // Sahelian short grass savanna / Savane sahélienne
    "0a9696", // Herbaceous savanna / Savane herbacée
    "749373", // Shrubland / Zone arbustive
    "505050", // Open mine / Carrière
    "FFFFFF"  // Cloud / Nuage
  ]
  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
  var remappedImage = classificationImage.remap(atlasClasses, ee.List.sequence(1, 26))
  classificationImage = classificationImage.addBands(remappedImage)
  Map.addLayer(classificationImage, {min:1, max:26, palette: atlasPalette, bands:'remapped'}, layerName)
}

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
{:. .souce .language-javascript}

We will now add a point to the map; we will classify this zone. Feel free to use your own zone! Our zones will be 56000 meters square (approximately one half degree).
~~~
var zoneSize = 56000
var classificationPoint = ee.Geometry.Point([-12.392578125, 12.399002919688813]);
var classificationZone = getClassificationZone(classificationPoint, zoneSize)
Map.addLayer(classificationZone, {}, 'classification zone')
~~~
{:. .source .language-javascript}

We will now classify this zone. First, we get the input image.
~~~
// Load Atlas image for labels
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

// Create a time filter for 2013
var timeFilter = ee.Filter.or(
    ee.Filter.date('2012-09-15', '2012-11-15'),
    ee.Filter.date('2013-09-15', '2013-11-15'),
    ee.Filter.date('2014-09-15', '2014-11-15')
  )

// Load Landsat 7 collection
var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

// Create input image for zone
var zoneImage = landsat7Collection
  .filterBounds(classificationZone)
  .filter(timeFilter)
  .map(maskLandsat)
  .median()
  .addBands(atlasImage)
  .clip(classificationZone)
~~~
{:. .source .language-javascript}

We will now create a classification zone the neighbors the .
~~~

~~~
{:. .source .language-javascript}

~~~
/*
  Including neighboring zones
*/

var neighborZonePoint = /* color: #d63000 */ee.Geometry.Point([-12.444763162638992, 12.427175804835738]);
var neighborZone = ee.Image.random()
  .multiply(10000000)
  .toInt()
  .reduceToVectors({
    crs: atlasImage.projection(),
    scale: zoneSize,
    geometry: neighborZonePoint
  });

var neighborImage = landsat7Collection
  .filterBounds(neighborZone)
  .filter(getLateYearFilter(2013))
  .map(maskLandsat)
  .median()
  .addBands(atlasImage)
  .clip(neighborZone)

var neighborPoints = ee.Image
  .random()
  .multiply(100000)
  .toInt()
  .reduceToVectors({
    crs: labelProjection,
    geometry: neighborZone,
    scale: labelProjection.nominalScale()
  })
  .map(function(feature) {
    var centroid = feature.centroid(5)
    return centroid
  })

Map.addLayer(neighborZone, {}, 'neighborZone')
assessClassification(neighborImage, neighborPoints, landsatBands, 'neighbor classification')
~~~
{:. .source .language-javascript}
<!-- <img src="../fig/06-zone-boundary-example-niamey.png" boder="10"> -->

In the Kedougou example, you can see that the neighbor classification is doing much better. Part of the reason for this is the boundary issue. There is a river that runs through these two zones, but the river only intersected with the sampling points in the northern zone. As a result, the `water` class is missing from the southern zone. As a result, there's a noticeable difference in the the images are classified in the two zones. To smooth the boundaries between the zones, we're going to sample data from outside of our zone as well as inside. This is similar to a 'kernel' in image processing:

<img src="../fig/06-kernel-example.png" border="10" >

<!-- We would also like to oversample minority classes, so that there is an even number of all of the training classes present... -->

Our process is going to be as follows:

* Generate the sampling points for the AOI as normal.
* Expand the AOI so that it encompasses all neighboring zones, and generate its sampling points.
* Sample from the expanded area, so that we have a new set of training points that is 50% in the original AOI, and 50% in the neighboring zones.

We have the sampling points from our AOI (`samplingPoints`). Let's get our neighboring sampling points. First, we need to expand our AOI so that it encompasses all neighbor zones. We're going to do this using `.buffer()`. `.buffer()` takes a geometry and expands it by a distance in meters (or shrinks it if the distance is negative). We want to expand our zone by the size of the zone.

~~~
var expandedZone = classificationZone.buffer(zoneSize)
Map.addLayer(expandedZone, {}, 'expanded zone')
~~~
{:. .source .language-javascript}


We can now create sampling points for this zone as we did for the other zones. We only want sampling points for pixels that are outside of our original zone. So, we can use the `.difference()` method to subtract the original zone from the expanded zone, and only get the resulting centerpoints.
~~~
var expandedPoints = getPoints(expandedZone.difference(zoneGeometry))
Map.addLayer(expandedPoints, {color: 'green'}, 'expanded points')
~~~
{:. .source .language-javascript}

So, let's create an expanded image, and sample centerpoints in that image.
~~~
var expandedImage = getLandsatImage(expandedZone)
var expandedData = expandedImage.addBands(ee.Image.pixelLonLat())
  .sampleRegions({
    collection: expandedPoints,
    scale: 30,
  })
  .map(toPoint)
~~~
{:. .source .language-javascript}
But, we don't want to take every single centerpoint, or the ratio of training points inside the zone to training points outside of the zone would be around 8:1, and signal from outside of the zone would overwhelm signal from inside of the zone. So, we add a random column to the collection, and use that to limit the size of the collection so that it is the same size as the zone data.
~~~
  .randomColumn('expandedDataSelection', 1)
  .limit(zoneData.size(), 'expandedDataSelection')
  .randomColumn('trainTestSplit')
~~~
{:. .source .language-javascript}

We want to create sampling and testing points for the zone itself as we would normally. We don't want to take every single training point inside of our buffered geometry, or the ratio of training points inside the zone to training points outside of the zone would be around 8:1, and signal from outside of the zone would overwhelm signal from inside of the zone.

We can then split the collection into a training and testing set like we normally do.

~~~
var expandedTrainingData = expandedData.filter(ee.Filter.lt('trainTestSplit', trainingSize))
var expandedTestingData = expandedData.filter(ee.Filter.gte('trainTestSplit', trainingSize))

var trainingData = zoneTrainingData.merge(expandedTrainingData)
var testingData = zoneTestingData.merge(expandedTestingData)

Map.addLayer(trainingData, {color: 'orange'}, 'trainingData')
Map.addLayer(testingData, {color: 'yellow'}, 'testingData')
~~~
{:. .source .language-javascript}

And we can train and classify, just like we normally do.

~~~
// Assess classifier on combined training data
print('Accuracy (combined testing set):', testingData.classify(expandedClassifier).errorMatrix('b1', 'classification').accuracy())
print('Accuracy (zone testing set):', zoneTestingData.classify(expandedClassifier).errorMatrix('b1', 'classification').accuracy())

displayAtlasClassification(zoneImage.classify(expandedClassifier), 'w/ neighbor classification')

assessClassification(neighborImage, neighborPoints, landsatBands, 'neighbor classification')
assessClassification(zoneImage, zonePoints, landsatBands, 'zone classification')
~~~
{:. .source .language-javascript}

## Imbalanced Datasets and Oversampling

The classification is a little bit better, but we're still not classify the River Gambie properly. Probably, this is because we're still not getting enough of the minority classes in our training set. We're still relying on chance to ensure a balanced class split, and sometimes such things are too important to leave up to chance. We can see that the class breakdowns are not matched by looking at the aggregate histograms of the data sets.

~~~
print('training data histogram', trainingData.aggregate_histogram('b1'))
print('combined area histogram', zoneData.merge(expandedData).aggregate_histogram('b1'))
~~~
{:. .source .language-javascript}

Some classes might be missing from our training data. Furthermore, even if all classes are present in both datasets, the training set is very **imbalanced**. There might be only one or two samples of one class, and hundreds of samples of another class. This means that our classifier might be more or less ignoring some of the classes that are less prevalent, such as water. But, we really care about such classes! We would like to find a way to turn our imbalanced dataset into a balanced dataset. There are different ways to deal with an imbalanced dataset.

If many datapoints of each class were present, we might **undersample** the majority classes. Undersampling would would mean that we limit the number of samples in each class to the number of samples present in the minority class. If class A had 100 samples, and class B had 1000 samples, we would only use 100 randomly selected samples from class B, and all of the samples from class A.

However, because we have very few samples from certain classes (such as only one sample from class 13, settlement/Zone d'Habitation), we will instead **oversample**. We will repeat samples from the minority classes until the number of samples from all classes are even. For example, using the prior example where we had 100 samples from class A and 1000 samples from class B, each sample from class A would appear in the training set 10 times, leading to an even split between the two classes. This let's the classifier 'see' the different classes more often and allows it to better learn classes that appear less frequently.

The first thing that we need to know is how many samples we should have per class. This is equal to the number of training samples (multiplied by two) divided by the number of classes in the buffered classification zone. We won't worry about where the points come from, so long as they're not coming from the testing points.
~~~
// Get the number of classes in our expanded area
var numberOfClasses = zoneTrainingData.merge(expanded).aggregate_count_distinct('b1')
// Get the number of samples in the training set
var samplesInTrainingSet = zoneTrainingData.size()

var samplesPerClass = samplesInTrainingSet.multiply(2).divide(numberOfClasses).int()
print('samplesPerClass', samplesPerClass)
~~~
{:. .source .language-javascript}

This next bit might be a little bit unintuitive. We're going to create an image collection that contains our expanded image collection, repeated as many times as we want samples for each class. Then, we take from each of those images a single sample from each class using `.stratifiedSample`. Finally we flatten the resulting collection of collections.

> ## Why not use `.stratifiedSample()`?
>
> Why don't we use the method `.stratifiedSample()` directly? The reason is that stratified sample will not, on its own, oversample an image. If we ask `.stratifiedSample()` for 100 of each class, but there are only 10 pixels of class A available, then `.stratifiedSample()` will return a collection with 10 of class A and 100 of class B. That's still an imbalanced dataset, and not what we want. `.stratifiedSample()` is appropriate for undersampling, but for oversampling, we need to figure out our own implementation.
{:. .callout}

You will notice that the region that we're sampling from is the union of the training set and the expanded set. We need to make sure that there aren't any testing points that fall within both the training set and the testing set. When testing data is available in the training data, it is called *leakage*. That's bad! Leakage is when your model has access to data that it shouldn't. In this case, the model is getting to peek at some of the validation data. When we actually try to create new land cover maps, the model won't be able to peek at anything: all of the data will be unknown. Leakage results in artificially high estimate of the classifier's accuracy: you think that the classifier is doing well, because it's 'cheating', but when exposed to real data, it will perform poorly.

~~~
// We now repeat the expanded image as many times as we want features for each class
var oversampledData = ee.ImageCollection(
    ee.List.repeat(expandedImage.addBands(ee.Image.pixelLonLat()), samplesPerClass)
  )
  .map(function(image) {
    return image.stratifiedSample({
      numPoints: 1,
      classBand: 'b1',
      region: expandedPoints.merge(zoneTrainingData),
      scale: 30,
      seed: ee.Number.parse(image.get('system:index'))
    })
    .map(toPoint)
  }).flatten()
~~~
{:. .source .language-javascript}

Notice that we use the index of each images as its seed, to ensure that we're sampling different points.

~~~
Map.addLayer(oversampledData, {color: 'pink'}, 'oversampledData')
~~~
{:. .source .language-javascript}

We now mix in the original training data with the data from the expanded zone, so that the classifier is learning data from the original zone.

~~~
trainingData = oversampledData.merge(zoneTrainingData)
~~~
{:. .source .language-javascript}

~~~
var classifier = ee.Classifier.randomForest(10).train(trainingData, 'b1', landsatBands)

print('Balanced classifier accuracy:', zoneTestingData.classify(classifier).errorMatrix('b1', 'classification').accuracy())
print('Balanced classifier kappa:', zoneTestingData.classify(classifier).errorMatrix('b1', 'classification').kappa())
displayAtlasClassification(zoneImage.classify(classifier), 'balanced classification')\
~~~
{:. .source language-javascript}

You can see that accuracy goes down a little bit. More importantly, however, the kappa value for our classification is higher. The classification is also qualitatively improved. Take a moment to look at the different classifications available, and see which you think is the most appropriate.

<img src="../fig/06-neighbor-sampling-points.png" border="10" >

```
var bufferedPoints = getCenterPoints(bufferedAoi, atlasV1_2013)
  // Add a random column
  .randomColumn()
  // Select as many points from the neighbor points as there are points in the AOI, sorted randomly
  .limit(samplingPoints.size(), 'random')
  // Drop all columns from the sampling points, thereby discarding the random column
  .select([])
Map.addLayer(bufferedPoints)
```

We then sample these points and add them to our training data. We don't include these points in the feature collection that we split into the training and testing data, because we only care how well the classifier does at classifying our AOI.

```
// Sample our landsat image at the neighborPoints
var bufferedData = sampleCollection(ee.ImageCollection(landsatImage), atlasV1_2013, bufferedPoints)
```
Finally, we merge the neighbor data with the training data, and proceed with the classification process as normal.

```
// Merge neighborPoints with the training points from the AOI
bufferedData = bufferedData.merge(trainingData)
```
```
/*
...
*/
```

How do our results look? Looking good. It looks like the zone boundary has been significantly reduced.
<img src="../fig/06-buffered-zone-boundary.png" border="10" >

We also get a pretty hefty bump in accuracy:
<img src="../fig/06-buffered-accuracy.png" border="10" >

Which is great!

## Review
We've explored a number of ways that we can improve the quality of our inputs. We looked into adding new features, either by including new datasets or by creating new features out of existing features. We looked into increasing the number of samples available in the training data by sampling multiple satellite images for a single datapoint. And finally we looked at smoothing the boundaries between zones by sampling data from the zones adjacent to our area of interest.
