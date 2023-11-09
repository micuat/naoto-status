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
  return "<div id=idMessage> " + airtableLoader.elements.map(e => `
  <div class="my-4">
    <div>
      <span class="text-gray-600">${ timeAgo.format(new Date(e.created)) }</span> <span>${ e.notes ? e.notes : "" }</span>
    </div>
    ${ e.images.map(e => `<img class="w-full max-w-xs inline" src=${ e } />`).join("") }
  </div>
`).join("").replace(/\n/g, "") + "</div>\n\n";
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
