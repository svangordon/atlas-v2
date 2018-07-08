---
title: "Displaying Maps"
teaching: 5
exercises: 30
questions:
- How do we display the Atlas and Atlas V2 datasets?
- How can we reuse code in different scripts?
objectives:
- Understand how to load Atlas and Atlas V2 datasets into Earth Engine
- Understand how to visualize Atlas and Atlas V2 images
keypoints:
- Atlas and Atlas V2 can be loaded in Earth Engine as `ee.Image()` and `ee.ImageCollection`
- Atlas and Atlas V2 maps must be remapped before being displayed
- The entire Atlas V2 dataset can be added to the map
- Functions like `print` and `Map.addLayer` cannot be used in functions that are running on the server side.
---

## Loading as `ee.Image`
The Atlas and Atlas V2 datasets are available as Earth Engine assets. User `svangordon/` currently hosts them in the folder `conference`.

Atlas images are in the folder `'users/svangordon/conference/atlas/'`. The Atlas images have the same filenames as the original files hosted by USGS.
~~~
var atlas_1975 = ee.Image('users/svangordon/conference/atlas/swa_1975lulc_2km')
var atlas_2000 = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var atlas_2013 = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

print(atlas_2000)
~~~
{: .source .language-javascript}
~~~
Image users/svangordon/conference/atlas/swa_2000lulc_2km (1 band)
  type: Image
  id: users/svangordon/conference/atlas/swa_2000lulc_2km
  version: 1530935774827023
  bands: List (1 element)
  properties: Object (4 properties)
~~~
{: .output}

Atlas V2 images are in the folder `'users/svangordon/conference/atlas_v2/classify/'`. The filename of each image is that image's year.

~~~
var atlasV2_2000 = ee.Image('users/svangordon/conference/atlas_v2/classify/2000')
var atlasV2_2001 = ee.Image('users/svangordon/conference/atlas_v2/classify/2001')
/* And so forth. */
var atlasV2_2015 = ee.Image('users/svangordon/conference/atlas_v2/classify/2015')
var atlasV2_2016 = ee.Image('users/svangordon/conference/atlas_v2/classify/2016')

print(atlasV2_2016)
~~~
{: .source .language-javascript}
~~~
Image users/svangordon/conference/atlas_v2/classify/2016 (1 band)
  type: Image
  id: users/svangordon/conference/atlas_v2/classify/2016
  version: 1530942617795941
  bands: List (1 element)
  properties: Object (4 properties)
~~~
{: .output}

## Loading as `ee.ImageCollection`
Both Atlas and Atlas V2 datasets are available as `ImageCollections`.
~~~
var atlasCollection = ee.ImageCollection('users/svangordon/conference/atlas/atlasCollection')
var atlasV2Collection = ee.ImageCollection('users/svangordon/conference/atlas_v2/collections/classify')
~~~
{: .language-javascript .source}

Using `ee.ImageCollection`s allows us to do things like filtering and reducing. For example, we could select Atlas V2 classifications from 2005 - 2010.
~~~
print( atlasV2Collection.filterDate('2005-01-01', '2010-01-01') )
~~~
{: .source .language-javascript}
~~~
ImageCollection users/svangordon/conference/atlas_v2/collections/classify (5 elements)
  type: ImageCollection
  id: users/svangordon/conference/atlas_v2/collections/classify
  version: 1530943502012404
  bands: []
  features: List (5 elements)
    0: Image users/svangordon/conference/atlas_v2/collections/classify/2005 (1 band)
    1: Image users/svangordon/conference/atlas_v2/collections/classify/2006 (1 band)
    2: Image users/svangordon/conference/atlas_v2/collections/classify/2007 (1 band)
    3: Image users/svangordon/conference/atlas_v2/collections/classify/2008 (1 band)
    4: Image users/svangordon/conference/atlas_v2/collections/classify/2009 (1 band))
~~~
{: .output}

## Display Classifications
Let's display the Atlas and Atlas V2 images on the map. We will need to provide visualization parameters for our images.

> ## Atlas Metadata
>
> To get the list of all Atlas classes and the list of colors, we used the Atlas metadata files. Metadata files for the Atlas data are available from the USGS Eros website and are included in the Zip files that contain the Atlas images. The metadata files have suffixes `.tif.aux.xml` and `.tif.xml`. The metadata files provide red, blue, green color values for different classes, which we convereted into Earth Engine-compatible hex values. If you ever find youself forced to do so, you can use an online tool like this one: https://www.colorhexa.com/.
>
{: .callout}

For `palette`, we will use a list of hex colors, derived from the Atlas metadata.
~~~
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
~~~
{:. .source .language-javascript}

### Remapping
When displaying a map, Earth Engine expects the values for a class to be consecutive integers. This creates problems when displaying images of categorical data where classes are not consecutive integers, which is the case for the Atlas and Atlas V2 data. [You can read more about displaying categorical maps in the Earth Engine documentation.](https://developers.google.com/earth-engine/image_visualization#rendering-categorical-maps)

There are 26 Atlas classes, so we must remap our image to numbers from 1 to 26. We will use the `.remap()` method. `.remap()` takes a `from` list and a `to` list. Values in the `from` list are converted to the matching value in the `to` list.

For the `from` list, we will use the list of Atlas classes we created using the Atlas metadata. For the `to` list, we will use an `ee.List.sequence` of the numbers 1 to 26.
~~~
var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
var remappedImage = atlas_2000.remap(atlasClasses, ee.List.sequence(1, 26))
Map.addLayer(remappedImage, {min:1, max:26, palette: atlasPalette}, 'Atlas Classification')
~~~
{: source .language-javascript}

<!-- Possible challenge: What would the map look like if we didn't remap? If we had a map with different classes, how would we change this code? -->

## Displaying an `ImageCollection`
It would be convenient to display the Atlas or Atlas V2 classification for each year in a collection. Let's first create a function to render an Atlas or Atlas V2 image for us. This function will take a classified `ee.Image()` and a string to use as the layer name. The function will remap the image and add it to the map.

~~~
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
  var remappedImage = atlas_2000.remap(atlasClasses, ee.List.sequence(1, 26))
  Map.addLayer(remappedImage, {min:1, max:26, palette: atlasPalette}, layerName)  
}
~~~
{:. .source .language-javascript}

We would like to display an image for every year in the Atlas V2 dataset. We could write out every single year in the dataset:
~~~
displayClassification(atlasV2_2000, "Atlas V2 2000")
displayClassification(atlasV2_2001, "Atlas V2 2001")
displayClassification(atlasV2_2002, "Atlas V2 2003")
~~~
{:. .source .language-javascript}

But this is time consuming, and we're likely to make a typo in the process. And if we decided that instead of displaying Atlas V2 data we wanted to display the Atlas data, we would have to type it all out again.

But there's another way that we can do this. We can create a list of dates and iterate over that list, filtering the Atlas V2 collection with each date and displaying the result.

> ## Duplicating text in the Editor
>
> It's a little time consuming to write out so many dates, but we can speed the process along by selecting a section of the code that you'd like to duplicate and pressing <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>.
{:. callout}

~~~
function displayClassificationCollection(classificationCollection) {  
  // Create a list of strings that are valid as EE dates (YYYY-MM-DD)
  var atlasV2Years = [
    "2000-01-01",
    "2001-01-01",
    "2002-01-01",
    "2003-01-01",
    "2004-01-01",
    "2005-01-01",
    "2006-01-01",
    "2007-01-01",
    "2008-01-01",
    "2009-01-01",
    "2010-01-01",
    "2011-01-01",
    "2012-01-01",
    "2013-01-01",
    "2014-01-01",
    "2015-01-01",
    "2016-01-01",  
  ]

  atlasV2Years.forEach(function(year) {
      var classificationImage = classificationCollection
        .filterDate(year)
        .first()
      displayClassification(classificationImage, "Atlas V2 " + year)
    })
}

displayClassificationCollection(atlasV2Collection)
~~~
{:. .source .language-javascript}

> ## Observing land cover changes with Atlas V2
>
> With the entire Atlas V2 dataset displayed in the map, you can enable and disable different layers to see land cover changes over time. Let's spend a little time to look through the map. Maybe go to an area that you know well, or that you are interested in. What ways do you think that the Atlas V2 dataset might be useful? In what ways do you think that it needs to be improved?

> ## Local vs Earth Engine Objects

>`atlasV2Years` is a local JavaScript object.
>* How can you tell?
>* How would we create the list of years as an Earth Engine object? Fill in the blank:
~~~
ee._____(atlasV2Years)
~~~
>* `.iterate` is a function that performs similarly to `forEach`. If you cast `atlasV2Years` to an Earth Engine object and replace`.forEach` with `.iterate`, you will get an error. Why? Hint: Try commenting out different bits of code inside the `.iterate` function.


> ## Solution
>
> * Earth Engine objects are created using `ee.ObjectType()` syntax
> * We would use a list function. Eg, atlasV2Years = ee.List(atlasV2Years)
> * The `.iterate` call takes place on Earth Engine servers, but `Map.addLayer` can only take place on local machines. If you use a function like `print` or `Map.addLayer` in a function that is running on the server, such as in an `.iterate` or `.map` method, there will be an error.


## Adding scripts to a repository

The `displayClassification` and `displayClassificationCollection` tools are convenient. We would like to be able to access them in other scripts. In Earth Engine, it's possible to export a function or a variable from one script and import it into another.

In our Scripts tab, create a new file called **workshopTools**. Paste the `displayClassification` and `displayClassificationCollection` scripts into that file.

Add the objects that you want to export as properties on the `exports` object.
~~~
exports.displayClassification = displayClassification
exports.displayClassificationCollection = displayClassificationCollection
~~~
{:. .source .language-javascript}

In another script, you can import it those functions.
~~~
var workshopTools = require('users/yourUserNameHere/default:workshopTools')
var displayClassification = workshopTools.displayClassification
~~~
