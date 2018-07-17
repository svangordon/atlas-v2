---
title: "Displaying Maps"
teaching: 20
exercises: 5
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

<!-- About 5 minutes to this point. -->

## Display Classifications
Let's display the Atlas and Atlas V2 images on the map. We need to provide visualization parameters for our images so that Earth Engine knows how to display them. We need to give Earth Engine a `palette` of colors to use, a `min` value that is the lowest value in the image, and a `max` value that is the highest value in the image.

### Palette
For `palette`, we will use a list of hex colors, derived from the Atlas metadata.

> ## Atlas Metadata
>
> To get the list of all Atlas classes and the list of colors, we used the Atlas metadata files. Metadata files for the Atlas data are available from the USGS Eros website and are included in the Zip files that contain the Atlas images. The metadata files have suffixes `.tif.aux.xml` and `.tif.xml`. The metadata files provide red, blue, green color values for different classes, which we convereted into Earth Engine-compatible hex values. If you ever find youself forced to do so, you can use an online tool like this one: https://www.colorhexa.com/.
>
{: .callout}

I'm not going to make us type out the palette for all 26 classes. Instead, we can access it in Earth Engine at the link below, and paste it into our code.

[bit.ly/2JuWicu](bit.ly/2JuWicu)

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

So we have our palette; now let's get our `min` and `max` values.

### Min, Max, and Remapping
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

## Using a Function to Remap
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
<!-- 20 minutes -->

Code from this episode is available at: bit.ly/2mkljNk
