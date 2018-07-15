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

You can view the assets in the conference folder with this link:
https://code.earthengine.google.com/?asset=users/svangordon/conference

Atlas images are in the folder `'users/svangordon/conference/atlas/'`. The Atlas images have the same filenames as the original files hosted by USGS.

Let's import the Atlas images.
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
Both Atlas and Atlas V2 datasets are available as `ImageCollections`. Load the image collection or import it from the assets tab.
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

## Images vs Image Collections

We're going to look into loading the Atlas and AtlasV2 images as both Images and Image Collections. You may be wondering what the difference is between and image and an image collection. An Image is a raster object, stored on the Earthe Engine servers. A collection is a container that holds any number of images (or features). You can think of it like a folder or directory on a computer. It's kind of like a sack. You might also think of it similar to a list or an array, with a few key differences. In a list or array, you can access arbitrary elements in the list. For example:
~~~
var myList = ee.List(1, 3, 5, 9, 2)
var thirdElement = myList.get(2)
print('third element is', thirdElement)
~~~
{:. .source .language-javascript}
~~~
third element is 5
~~~
{:. .output}
> ## Array Indexing
>
> Remember, when counting array positions, we start counting from 0. `myList.get(0)` is the first element, `myList.get(1)` is the second element, and so forth.
{:. .callout}

With a collection, there is no such method available. Collections are optimized to work with features and images, and will run faster than an `ee.List` would containing the same data. Part of the trade-off for this better performance is that we cannot access arbitrary elements in a collection.

There are a couple of ways that we can mitigate this limitation. We can get the first element of a collection using the `.first()` method. (Note that you will always have to cast the returned value to an `ee.Image` or `ee.Feature`. This is useful if you want to look at the first value in a collection while your developing, or if you are trying to empty a collection with only one element.

It is also possible to convert collections to lists. We want to avoid doing this when we can, as it's a computationally expensive process, but sometimes it is simply unavoidable. To convert a collection to a list, we can use the `.toList()` method. If we want to access a specific element in that collection, we can use the arguments to limit the resulting list to a single element, offset by the index of the element we would like to access.
~~~
var fifthElement = collection.toList(1, 5).get(0)
~~~
{:. .source language-javascript}

### Which do we want?
The advantage to loading the Atlas and AtlasV2 data as `ee.Image`s is that we can access specific specific years directly. If you want the classification for 2013, you can load that image. The advantage to loading the images as an `ee.ImageCollection` is that we can filter the images by date. For example, if you wanted to get all images from 2000 - 2010, we could load it as an image collection and then use `atlasV2Collection.filterDate('2000-01-01', '2010-01-01')` to select only those images.

In general, if you know specifically which years you are interested in, it might make more sense to load the data as an `ee.Image`. If you might like to get different years, or you are loading many years and don't want to type them all out, use an `ee.ImageCollection`.


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

> ## Challenge
>
> * What would the map look like if we didn't remap the image?
> * If you wanted to add another class, for example a class with a value of `100` and a color of `"#343434"`, how would you do it?
> * [A MODIS color palette can be found here](https://lpdaac.usgs.gov/about/news_archive/modisterra_land_cover_types_yearly_l3_global_005deg_cmg_mod12c1). Try changing the Atlas palette so that it has the same colors as the MODIS dataset.
{:. .challenge}

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

<!-- Possibly, remove this section. It requires a lot of typing, and requires us to use client side objects in a way that server side objects cannot be used. -->
But there's another way that we can do this. We can create a list of dates and iterate over that list, filtering the Atlas V2 collection with each date and displaying the result.

> ## Duplicating text in the Editor
>
> It's a little time consuming to write out so many dates, but we can speed the process along by selecting a section of the code that you'd like to duplicate and pressing <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>.
{:. .callout}

~~~
function displayClassificationCollection(classificationCollection, startDate, numberOfYears) {
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
{:. .challenge}

<!-- Probably, remove this too. -->
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
