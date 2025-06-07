# Home-IoT System

## Setup

### LocalHost certification

```sh
cd src/frontend/
mkdir -p .ssl-certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout .ssl-certs/localhost-key.pem \
  -out .ssl-certs/localhost-cert.pem \
  -subj "/CN=localhost" \
  -days 365
```

And optionally

```sh
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain .ssl-certs/localhost-cert.pem
```
