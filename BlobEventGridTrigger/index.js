const Jimp = require("jimp");
const stream = require("stream");
const { BlockBlobClient } = require("@azure/storage-blob");
const fetch = require("node-fetch");
const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

module.exports = async function (context, eventGridEvent, inputBlob) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobUrl = context.bindingData.data.url;
  const blobName = blobUrl.split("/")[4];
  const containerName = "thumbnails";

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
