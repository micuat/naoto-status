import express from 'express';
const router = express.Router()

import enableWs from 'express-ws';
enableWs(router);

import AirtableLoader from "./libs/airtable-loader.js";

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)

const timeAgo = new TimeAgo('en-US')

const airtableLoader = new AirtableLoader(
  process.env.AIRTABLE_KEY,
  process.env.AIRTABLE_ID,
  "Table 1",
  "Grid view"
);
airtableLoader.poll();

function formatData() {
  return "<div id=idMessage>" +
    airtableLoader.elements.map(e => `${
      e.images.map(im => `
      <div class="w-64 relative group inline"><img class="w-full max-w-xs inline" src=${ im } />
        <div class="opacity-0 group-hover:opacity-100 duration-300 absolute inset-x-0 bottom-0 bg-gray-200 text-black font-semibold">
          <div class="">${ e.notes ? e.notes : "" }</div>
          <div class="text-gray-600">${ timeAgo.format(new Date(e.created)) }</div>
        </div>
      </div>`).join("") }`)
      .join("").replace(/\n/g, "").replace(/\>[\n ]+\</g,'><') +
    "</div>\n\n";
}

router.get('/api/content', async function(req, res) {
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  // Tell the client to retry every 10 seconds if connectivity is lost
  res.write('retry: 10000\n\n');
  let count = 0;
  
  req.on('close', () => {
    airtableLoader.eventEmitter.removeListener("airtable updated", writeData);
  });

  function writeData() {    
    res.write("data: " + formatData());
  }
  writeData();
  airtableLoader.eventEmitter.on("airtable updated", writeData);
});

router.post('/api/content', async function(req, res, next) {
  res.send(formatData());
});

router.ws('/ws/stream', function(ws, req) {
  ws.on('close', () => {
    airtableLoader.eventEmitter.removeListener("airtable updated", writeData);
  });

  function writeData() {
    ws.send(formatData());
  }
  writeData();
  airtableLoader.eventEmitter.on("airtable updated", writeData);
});

router.use('/api/images', express.static(process.env.DATA_PATH + '/images'))

export default router;
