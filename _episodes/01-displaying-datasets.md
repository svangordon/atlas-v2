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

## Overview
We are going to discuss accessing and displaying the Atlas and AtlasV2 datasets in Earth Engine.

In this episode, we will discuss how to load the Atlas and AtlasV2 datasets as images or image collections. We will then discuss how to display these images onto the map.

> ## Earth Engine Assets
>
> Currently, both Atlas and AtlasV2 are available as Earth Engine **assets**. By assets, be mean that they are files that are available through Earth Engine. Earth Engine assets can be images, image collections, or feature collections. Images are raster data, image collections are groups of raster data, and feature collections groups of vector data.
>
> The Atlas and AtlasV2 data are available as images and image collections. The data is the same in the images and the image collections. The image collections are just a set of images.
>
> Earth Engine assets live on Google's servers. We don't have to download them or anything like that to interact with them.
{:. .callout}

## Loading as `ee.Image`
The Atlas and Atlas V2 datasets are available as Earth Engine assets. User `svangordon/` currently hosts them in the folder `conference`.

<!-- You can view the assets in the conference folder with this link:
https://code.earthengine.google.com/?asset=users/svangordon/conference -->

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
/*Map.addLayer(remappedImage, {min:1, max:26, palette: atlasPalette}, 'Atlas Classification')*/
~~~
{: source .language-javascript}

We would like the original, non-remapped values to be available on that image, so let's add the original `b1` band back on the image.
~~~
Map.addLayer(remappedImage.addBands(atlas_2000), {min:1, max:26, palette: atlasPalette, bands:'remapped'}, 'Atlas Classification, original values available')
~~~
{:. .source .language-javascript}

Try clicking around using the inspector a little bit.

> ## Challenge
>
> * What would the map look like if we didn't remap the image?
> * If you wanted to add another class, for example a class with a value of `100` and a color of `"#343434"`, how would you do it?
> * [A MODIS color palette can be found here](https://lpdaac.usgs.gov/about/news_archive/modisterra_land_cover_types_yearly_l3_global_005deg_cmg_mod12c1). Try changing the Atlas palette so that it has the same colors as the MODIS dataset.
{:. .challenge}

Now, let's roll all of that code into a function. This will make things easier for us down the line: the next time that we want to display an Atlas image, we just invoke our function. The function will take as arguments an image to display and a title that should be used as that image's name.

First we create the function's signature, ie, its name and its parameters.
~~~
function displayClassification(classificationImage, layerName) {
~~~
{:. .source .language-javascript}
We want to **cast** the `classificationImage` to an `ee.Image()`. If we haven't talked about casting, we will soon. Basically, this means that we're telling Earth Engine that `classificationImage` is an `ee.Image`. Sometimes, Earth Engine isn't totally 100% sure what kind of Earth Engine object a certain variable is. For example, the value of `collection.first()` could be a feature, or it could be an image. This can cause problems. So, we are removing any ambiguity by telling Earth Engine that `classificationImage` is an image (and if it wasn't, it is now).
~~~
  // Cast classificationImage to Image
  classificationImage = ee.Image(classificationImage)
~~~
{:. .source .language-javascript}  

Now, let's create a palette for our classes. This is the same as the palette we used before, and in fact, if we didn't create this palette, the function would still work (when we used the variable `palette`, Earth Engine would look for a variable with the name `palette` inside of the function, and upon failing to find it, would look up another level for a variable named `palette`, and finding one, would use that value). However, we would like our function to be as self-contained as possible. We want it to be possible to paste this function into new code and not have to worry about whether or not we set up a `palette` variable, or to worry about whether we have another variable named `palette` that will conflict with the palette this function is using.
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
Now we create our list of Atlas classes, taken from the USGS Atlas metadata files, and use that to remap our image.
~~~
  var atlasClasses = [1,2,3,4,6,7,8,9,10,11,12,13,14,15,21,22,23,24,25,27,28,29,31,32,78,99]
  var remappedImage = classificationImage.remap(atlasClasses, ee.List.sequence(1, 26))
~~~
{:. .source .language-javascript}
We add the remapped image to the original image. Again, the only reason we're doing this step is so that we can view the original class values in the inspector tab if we choose to do so.
~~~
  classificationImage = classificationImage.addBands(remappedImage)
~~~
{:. .source .language-javascript}
We now add the image to the map. The minimum value is 1, the maximum value is the length of the list containing the atlasClasses, which is 26.
~~~
  Map.addLayer(classificationImage, {min: 1, max: 26, palette: atlasPalette, bands:'remapped'}, layerName)
~~~
{:. .source .language-javascript}
And a closing curly brace to close the function body.
~~~
}
~~~
{:. .source language-javascript}

Let's test out our function.
~~~
displayClassification(atlas_2000, 'Atlas 2000')
~~~
{:. .source .language-javascript}

## Displaying an `ImageCollection`
It would be convenient to display the Atlas or Atlas V2 classification for each year in a collection. There's an obstacle in our way, however. If you add an `ImageCollection` to the map, only the most recent image of the collection is displayed. Furthermore, `Map.addLayer` is a **client-side** operation. This means that it cannot take place inside of an `ee.Object.map` call. For example, we could not convert the AtlasV2 collection to a list, and then `.iterate()` over each image and display it.
~~~
// Will not work!
atlasV2Collection.map(function(image) {
    Map.addLayer(image)
    return image
  })
~~~
{:. .source .language-javascript}

Any `ee.Object.map` call is taking place _on the server_. Once a process is pushed to the server, you can't know anything about it until it's all the way done. This means you cannot have a `print()` or `Map.addLayer()` call inside of an `ee.Object.map` call. One way to imagine this is that what your computer is doing locally is creating a set of instructions to send to the server. Once those instructions are sent, there's no going back: the Earth Engine servers can't interrupt their process to send you information part of the way through or to ask you for more information.

As an analogy, imagine that you were asking a friend to do your shopping. You give them a list of things that you want, and send them off to the market, and then there is no communication between you and your shopper until they get back from the market. (Please ignore cellphones for the purposes of this example!) You could give them a set of instructions, such as: "buy one kilo of potatoes; buy the largest ham they have; buy a dozen eggs; buy a half kilo of brown sugar, or if they don't have brown sugar, buy a half kilo of white sugar and 300ml of molasses". But you could not give them a set of instructions that require them to interact with you _after_ they've gone to market. It wouldn't make any sense to say something like, "Go to the market, and show me the cabbages, and if I think that they look good, buy some". Because once you have given them that list of instructions and they've gone to the market, that is the end of your interactions with them until they've finished their shopping.

Essentially, what our instructions are saying is "Go to the market, and go to the section where they have AtlasV2 images, and show me all of the AtlasV2 images". But that doesn't work, because our helper is already at the market, so they can't do a _client-side_ action like `Map.addLayer`.

How are we going to deal with this? One possibility is that we could explicitly write out all of our instructions. We could say:
~~~
displayClassification(atlasV2_2000, "Atlas V2 2000")
displayClassification(atlasV2_2001, "Atlas V2 2001")
displayClassification(atlasV2_2002, "Atlas V2 2003")
~~~
{:. .source .language-javascript}

> ## Duplicating text in the Editor
>
> It's a little time consuming to write out so many dates, but we can speed the process along by selecting a section of the code that you'd like to duplicate and pressing <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>.
{:. .callout}

This is essentially saying "Go get the AtlasV2 image for 2000, bring it back, and show it to me. Now go get the AtlasV2 image for 2001, bring it back, and show it to me. Now go get the AtlasV2 image for 2002, and bring it back, and show it to me." This is a perfectly fine way to perform this process, and sometimes in a pinch it really is your best option. However, it's a little bit on the time consuming side, and the more typing that we do, the more likely we are to make a mistake and the harder it will be to change our code later if we want it to do something a little bit different.

So, we can't use `Map.addLayer` when we iterate over Earth Engine objects on the _server-side_. We can, however, use `Map.addLayer` when we iterate over JavaScript objects on the _client-side_. Earth Engine objects exist on the Earth Engine server, but JavaScript objects exist on our local machine (ie, your personal computer), and are used to create the instructions for the Earth Engine servers. And something we can do is turn a server-side object into a client-side object. When we turn a server-side object into a client-side object, we give Earth Engine a set of instructions to execute, like we do normally. But then, when Earth Engine finishes carrying out that set of instructions, we use the value that it returned to create a new set of instructions.

To continue our shopping analogy, it would be like if you sent your friend to the market, asked him to write down how much of different items were available and their price, and then used that information to prepare another set of instructions and sent him back to the market. (Your friend is very obliging, I know!)

In Earth Engine, there are two ways that we can turn an Earth Engine object into a JavaScript object. The most common way is with `.getInfo()`. `.getInfo` tells Earth Engine to stop everything and immediately send back a server-side object's value. The problem with `.getInfo()` is that it totally halts all execution of code until Earth Engine has determined what an object's value is. This is an issue if we are trying to use `.getInfo()` with a long running process or with a calculation that takes a long time to complete, and in such a case we would use `.evaluate`, but for our example `.getInfo` is appropriate.

To display our collection, we will turn the Earth Engine object `atlasV2Collection` into a local JavaScript object (a dictionary). That object will have the property `features`, which will contain a list of all the images in the collection. Each image will have the property `id`, which will contain a string, which will allow us to create an `ee.Image` object to add to the map. We will iterate over the collection using the method `.forEach`, which is a method available only on local JavaScript objects (ie, it is not available on server-side Earth Engine objects).
~~~
atlasV2Collection.getInfo().features.forEach(function(image, index) {
  displayClassification(ee.Image(image.id), index + 2000)
  })
~~~
{:. .source .language-javascript}


<!-- Probably, remove this too. -->
## Adding scripts to a repository

The `displayClassification` tool is convenient. We would like to be able to access it in other scripts. In Earth Engine, it's possible to export a function or a variable from one script and import it into another.

In our Scripts tab, create a new file called **workshopTools**. Paste the `displayClassification` script into that file.

Add the objects that you want to export as properties on the `exports` object.
~~~
exports.displayClassification = displayClassification
~~~
{:. .source .language-javascript}

In another script, you can import it those functions.
~~~
var workshopTools = require('users/yourUserNameHere/default:workshopTools')
var displayClassification = workshopTools.displayClassification
~~~
