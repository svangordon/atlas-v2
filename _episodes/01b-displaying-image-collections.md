---
title: "Displaying Image Collections"
teaching: 5
exercises: 30
questions:
- How do we display a collection of images?
objectives:
- Understand difference between images and image collections.
- Understand the limitations and advantages of collections.
keypoints:
- Collections are an efficient way to store data, but have drawbacks. For example, arbitrary elements from a collection cannot be accessed.
---

## Image Collections
We have loaded the data as an image. We can also load it as an image collection. Image collections are a way to group images; we can then sort through and composite them in different ways.

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
