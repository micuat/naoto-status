import express from 'express';
const router = express.Router()

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
    res.write("data: <div> " + airtableLoader.elements.map(e => `
      <div>
        <div>
          <span class="text-gray-600">${ timeAgo.format(new Date(e.created)) }</span> <span>${ e.notes ? e.notes : "" }</span>
        </div>
        ${ e.images.map(e => `<img class="w-full max-w-xs" src=${ e } />`).join("") }
      </div>
    `).join("").replace(/\n/g, "") + "</div>\n\n");
  }
  writeData();
  airtableLoader.eventEmitter.on("airtable updated", writeData);
});

router.post('/api/content', async function(req, res, next) {
  res.send(airtableLoader.elements.map(e => `
    <div>
      <div>
        <span class="text-gray-600">${ timeAgo.format(new Date(e.created)) }</span> <span>${ e.notes ? e.notes : "" }</span>
      </div>
      ${ e.images.map(e => `<img class="w-full max-w-xs" src=${ e } />`).join("") }
    </div>
  `).join(""));
});

router.use('/api/images', express.static('/data/images'))

export default router;
