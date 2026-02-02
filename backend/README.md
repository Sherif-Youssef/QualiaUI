## 1. Configure Environment Variables

Create `.env` file then set the values

```bash
cp .env.example .env
```

---

## 2. Build the Docker Image

From the project root:

```bash
docker build -t qualia .
```

## 3. Create the Container

Start the API and expose it on port **8000**:

```bash
docker run --name qualia_backend --env-file .env -p 8000:8000 -v ${PWD}:/app qualia
```

---

## 4. Verify It’s Running

Open your browser

```
http://localhost:8000/docs
```