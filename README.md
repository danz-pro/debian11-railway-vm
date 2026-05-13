# Debian 11 Web Terminal - Railway Deploy

## Cara Deploy ke Railway

### Metode 1: Railway CLI (Recommended)
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Init & Deploy
cd debian11-railway-vm
railway init
railway up
```

### Metode 2: GitHub + Railway Dashboard
1. Push folder ini ke GitHub repo
2. Buka https://railway.app
3. New Project > Deploy from GitHub repo
4. Pilih repo > Deploy

### Metode 3: Railway Dashboard (Manual)
1. Buka https://railway.app > New Project
2. Empty Project > Add Service > Dockerfile
3. Upload semua file ini
4. Railway auto build & deploy

## Akses Web Terminal

Setelah deploy berhasil:
1. Buka **Settings > Networking** di Railway
2. Klik **Generate Domain** atau **Custom Domain**
3. Buka URL yang diberikan di browser
4. Langsung dapet terminal Debian 11!

## Login Info
- **User:** root
- **Password:** debian11
- **Port:** 8080

## Ganti Password
Edit baris ini di `Dockerfile`:
```dockerfile
RUN echo 'root:debian11' | chpasswd
```
Ganti `debian11` dengan password yang lo mau.

## Catatan Penting
- **Free Plan**: Container bisa sleep setelah tidak aktif (bukan 24/7)
- **Paid Plan ($5/mo)**: True 24/7
- **Storage**: Ephemeral (data hilang saat restart/redeploy)
- **Resource**: Terbatas sesuai plan Railway

## Tools yang udah terinstall
- curl, wget, git
- nano, vim
- htop, net-tools, ping
- jq, unzip
- openssh-client

## Tambah Tools
Edit bagian `apt-get install` di Dockerfile untuk nambah package.
