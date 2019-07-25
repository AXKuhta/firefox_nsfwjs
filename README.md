This is a Firefox extension based around [NSFWJS](https://github.com/infinitered/nsfwjs) library.

It checks every image on the page and hides the NSFW ones. 

For now it's tuned to work only on old.reddit.com, and only on images — no GIFs or videos.

Load the extension by opening up about:debugging, clicking "Load Temporary Add-on", and selecting the manifest.json. With that done, you can enable it for private windows like with any other extension.

You can test it out on r/confusedboners — they've got quite a wide variety of images, from confusing SFW to actual porn.

This here is just a buggy and incomplete proof of concept. If someone wants to pick up on this — absolutely go ahead!

Note: the NSFWJS library here has had some modifications done to it so that it works fully locally, in case you want to change it to upstream version.
