const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const channels = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'channels.json'), 'utf-8'));
const programTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'programs.json'), 'utf-8'));

app.use(cors());
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'src', 'assets')));

function computePrograms(now = new Date()) {
  return programTemplates.map((template, index) => {
    const start = new Date(now.getTime() + template.startOffset * 60 * 1000);
    const end = new Date(start.getTime() + template.duration * 60 * 1000);
    return {
      id: `${template.channelId}-${index}`,
      channelId: template.channelId,
      title: template.title,
      description: template.description,
      start: start.toISOString(),
      end: end.toISOString()
    };
  });
}

function formatForEpg(dateString) {
  const date = new Date(dateString);
  const pad = (value, length = 2) => value.toString().padStart(length, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    ' +0000'
  );
}

app.get('/api/channels', (_req, res) => {
  res.json(channels);
});

app.get('/api/programs', (_req, res) => {
  res.json(computePrograms());
});

app.get('/playlist.m3u', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const lines = [`#EXTM3U x-tvg-url=\"${baseUrl}/epg.xml\"`];
  channels.forEach((channel) => {
    const logoUrl = `${baseUrl}/${channel.logo}`;
    lines.push(
      `#EXTINF:-1 tvg-id=\"${channel.epgId}\" tvg-name=\"${channel.name}\" tvg-logo=\"${logoUrl}\" group-title=\"${channel.category}\",${channel.name}`
    );
    lines.push(channel.streamUrl);
  });

  res.header('Content-Type', 'audio/x-mpegurl');
  res.send(lines.join('\n'));
});

app.get('/epg.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const programs = computePrograms();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<tv generator-info-name="Open TV UI Demo Guide">\n';

  channels.forEach((channel) => {
    xml += `  <channel id="${channel.epgId}">\n`;
    xml += `    <display-name>${channel.name}</display-name>\n`;
    xml += `    <icon src="${baseUrl}/${channel.logo}" />\n`;
    xml += '  </channel>\n';
  });

  programs.forEach((program) => {
    const channel = channels.find((item) => item.id === program.channelId);
    if (!channel) {
      return;
    }

    xml += `  <programme start="${formatForEpg(program.start)}" stop="${formatForEpg(program.end)}" channel="${channel.epgId}">\n`;
    xml += `    <title>${program.title}</title>\n`;
    xml += `    <desc>${program.description}</desc>\n`;
    xml += '  </programme>\n';
  });

  xml += '</tv>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.listen(port, () => {
  console.log(`Mock IPTV backend running on http://localhost:${port}`);
});
