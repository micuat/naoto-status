import sharp from "sharp";
import axios from "axios";
import fs from "fs";

export default class AirtableLoader {
  constructor(key, baseName, tableName, viewName) {
    this.elements = [];
    this.key = key;
    this.baseName = baseName;
    this.tableName = tableName;
    this.viewName = viewName;
    this.lastJson = "";
  }
  poll() {
    setInterval(() => {
      this.load();
    }, 60 * 1000)
    this.load();
  }
  async load() {
    const headers = { 'Authorization': `Bearer ${ this.key }` }; // auth header with bearer token
    const response = await axios.get(`https://api.airtable.com/v0/${ this.baseName }/${ this.tableName }`, { headers })
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
              if (fs.existsSync(`images/${el.id}-${i}`) == false) {
                let url = e.fields.Attachments[i].thumbnails.large.url;
                const input = (await axios({ url, responseType: "arraybuffer" })).data;
                await sharp(input)
                .resize(600, 600)
                .toFile(`images/${el.id}-${i}`);
              }
              el.images.push(`/api/images/${el.id}-${i}`)
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
  }
}