const { spawn } = require('child_process')

exports.handler = async ({ domain }) => {
  if (!isValidDomain(domain)) throw new Error('Invalid domain')
  const nameservers = await fetchNameserversFromDomain(domain)
  return {
    statusCode: 200,
    body: JSON.stringify({ nameservers }),
  }
}

function isValidDomain(domain) {
  return /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/.test(domain)
}

function parseNameservers(nameserverString) {
  const getList = nameserverString.split('\n')
  const nsList = getList.map(item => {
    const nsItem = item.trim().split('.')
    return nsItem[nsItem.length - 3]
  })
  // :: Remove duplicates and empty items
  const nsListWithoutDuplicates = [...new Set(nsList.filter(Boolean))]
  return nsListWithoutDuplicates
}

function fetchNameserversFromDomain(domain) {
  return new Promise((resolve, reject) => {
    spawnProcess(domain, nameserver => {
      resolve(parseNameservers(nameserver))
    })
  })
}

function spawnProcess(domain, callback) {
  const proc = spawn('dig', [domain, 'NS', '+short'])
  let nameserverData = ''
  proc.stdout.on('data', data => nameserverData += data.toString())
  proc.stderr.on('error', error => console.error(error))
  proc.on('close', () => callback(nameserverData))
}