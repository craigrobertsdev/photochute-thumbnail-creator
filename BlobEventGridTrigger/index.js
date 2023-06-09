const Jimp = require("jimp");
const stream = require("stream");
const { BlockBlobClient } = require("@azure/storage-blob");
const fetch = require("node-fetch");
<<<<<<< HEAD

=======
>>>>>>> 33d5d4da23949791bccb6dbbc8cbbcab925586e5
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

module.exports = async function (context, eventGridEvent, inputBlob) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobUrl = context.bindingData.data.url;
<<<<<<< HEAD
  const blobName = blobUrl.split("/")[4];
  const containerName = "thumbnails";
=======
  // const containerName = blobUrl.split("/")[3];
  const containerName = "thumbnails";
  const blobName = blobUrl.slice(blobUrl.lastIndexOf("/") + 1);
>>>>>>> 33d5d4da23949791bccb6dbbc8cbbcab925586e5

  const widthInPixels = 250;
  Jimp.read(inputBlob).then((thumbnail) => {
    thumbnail.resize(widthInPixels, Jimp.AUTO).quality(80);

    thumbnail.getBuffer(Jimp.MIME_PNG, async (err, buffer) => {
      const readStream = stream.PassThrough();
      readStream.end(buffer);

      const blobClient = new BlockBlobClient(connectionString, containerName, blobName);
      try {
        await blobClient.uploadStream(
          readStream,
          uploadOptions.bufferSize,
          uploadOptions.maxBuffers,
          { blobHTTPHeaders: { blobContentType: "image/jpeg" } }
        );

        const response = await fetch("https://photochute.herokuapp.com", {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            thumbnailUrl: `https://photochute.blob.core.windows.net/thumbnails/${blobName}`,
          }),
        });
      } catch (err) {
        context.log.error(err);
      }
    });
  });
};
