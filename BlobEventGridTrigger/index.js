const Jimp = require("jimp");
const stream = require("stream");
const { BlockBlobClient } = require("@azure/storage-blob");

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

module.exports = async function (context, eventGridEvent, inputBlob) {
  // const containerName = "thumbnails";
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const blobUrl = context.bindingData.data.url;
  const containerName = blobUrl.split("/")[3];
  const blobName = blobUrl.slice(blobUrl.lastIndexOf("/") + 1);

  // separate the file name from extension and insert "-thumbnail" at the end of the file name before the extension
  // const fileName = originalBlobName.slice(0, originalBlobName.lastIndexOf("."));
  // const fileExtension = originalBlobName.slice(originalBlobName.lastIndexOf("."));
  // const blobName = fileName + "-thumbnail" + fileExtension;

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
      } catch (err) {
        context.log(err.message);
      }
    });
  });
};
