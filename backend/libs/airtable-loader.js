import sharp from "sharp";
import axios from "axios";
import fs from "fs";
import { EventEmitter } from "events";

export default class AirtableLoader {
  constructor(key, baseName, tableName, viewName) {
    this.eventEmitter = new EventEmitter;
    this.elements = [];
    this.key = key;
    this.baseName = baseName;
    this.tableName = tableName;
    this.viewName = viewName;
    this.lastJson = "";

    const dir = process.env.DATA_PATH + "/images";

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
  }
  poll() {
    setInterval(() => {
      this.load();
    }, process.env.UPDATE_INTERVAL_SEC * 1000)
    this.load();
  }
  async load() {
    const headers = { 'Authorization': `Bearer ${ this.key }` }; // auth header with bearer token
    const response = await axios.get(`https://api.airtable.com/v0/${ this.baseName }/${ this.tableName }`, { headers })
    if (JSON.stringify(this.lastJson) === JSON.stringify(response.data)) {
      return;
    }
    this.lastJson = response.data;
    this.elements = response.data.records.map(async (e) => {
      try {
        const el = {};
        el.id = e.id;
        for (const key of Object.keys(e.fields)) {
          el[key.toLocaleLowerCase()] = e.fields[key] === undefined ? "" : e.fields[key];
        }
        el.images = [];
        if (e.fields.Attachments) {
          for (let i = 0; i < e.fields.Attachments.length; i++) {
            if (e.fields.Attachments[i].thumbnails?.large) {
              if (fs.existsSync(`${ process.env.DATA_PATH }/images/${el.id}-${i}`) == false) {
                let url = e.fields.Attachments[i].thumbnails.large.url;
                const input = (await axios({ url, responseType: "arraybuffer" })).data;
                await sharp(input)
                .resize(600, 600)
                .toFile(`${ process.env.DATA_PATH }/images/${el.id}-${i}`);
              }
              el.images.push(`https://naoto-status-production.up.railway.app/api/images/${el.id}-${i}`)
            }
          }
        }
        return el;
      } catch (err) {
        console.error(err);
      }
    });
    this.elements = await Promise.all(this.elements);
    this.elements.sort((a, b) => new Date(b.created) - new Date(a.created));
    this.eventEmitter.emit("airtable updated");
  }
}
