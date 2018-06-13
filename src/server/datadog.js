import Transport from 'winston-transport';
import axios from 'axios';
import os from 'os';

class Event {
  constructor(opts) {
    return {
      title: 'LOG',
      priority: 'normal',
      host: os.hostname(),
      alert_type: 'info',
      source_type_name: 'NODE',
      text: JSON.stringify(opts)
    };
  }
}

class DatadogTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.apiKey = opts.apiKey;
    this.appKey = opts.appKey;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    console.log(JSON.stringify(info));

    axios
      .post(`api/v1/events?api_key=${this.apiKey}`, new Event(info), {
        baseURL: 'https://api.datadoghq.com'
      })
      .catch((error) => {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      })
      .then((res) => {
        console.log(res.status);
      });
    // Perform the writing to the remote service
    callback();
  }
}

export default DatadogTransport;
