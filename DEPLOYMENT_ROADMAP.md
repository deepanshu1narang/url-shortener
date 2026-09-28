# Deployment, Docker, CI/CD & observability — big picture

## Suggested order (and why)

**Docker locally first, then manual AWS deploy, then automate it as CI/CD, then add logging/metrics.** Reasoning: learn each layer on top of one you already understand. Docker is easiest to learn against an app you already know inside out, on your own machine, with no cloud variables involved. Deploying manually to AWS once, by hand, teaches you what's actually happening (EC2, security groups, SSH) before you automate it — a pipeline that does something you've never done by hand yourself is just cargo-culting YAML. Logging/metrics only make sense once something is actually running remotely to observe.

---

## 1. Docker (learning goal — containerize what you already have)

- **Two Dockerfiles**: one for the backend (Node/Express), one for the frontend (build the Vite app, serve the static output via a small `nginx` image — a container doesn't run `npm run dev`, it serves the built artifact).
- **`docker-compose.yml`** to run backend + frontend + MongoDB together locally — this is the local equivalent of what you'll run in production, and it's the natural place to learn container networking (services reaching each other by service name instead of `localhost`) and volumes (so MongoDB's data survives a container restart).
- Goal for this phase: `docker compose up` locally reproduces the whole app, no `node index.js` / `npm run dev` needed by hand anymore.

## 2. AWS (free tier) — manual deploy first

Free-tier-friendly pieces worth using:
- **EC2** (`t2.micro`/`t3.micro`) — 750 hrs/month free for 12 months. This is where your Docker containers actually run. Install Docker on it, `git clone` (or `scp` your images), `docker compose up`.
- **MongoDB — a real decision to make, not a default**: either (a) run Mongo in a container on the same EC2 instance (keeps everything AWS/Docker-based, more ops to learn, more to manage), or (b) use **MongoDB Atlas's free tier** (a separate service, genuinely free forever, 512MB — the common real-world default for small Node+Mongo apps, since it offloads DB operations entirely). Given Docker is an explicit learning goal here, (a) teaches more; (b) is what you'd actually do professionally for something this size. Your call.
- **ECR** (container registry) to store your built images, so EC2 pulls a built image instead of rebuilding from source on the server.
- **IAM** — set up a scoped-down user/role for deployment access, not your root AWS account credentials.

**Deliberately skip for now** (real costs, not free-tier): an Application Load Balancer, and Route 53 (custom domain). For a learning deploy, hit the EC2 instance directly by its public IP (or AWS's free auto-assigned DNS) — a load balancer and custom domain are easy to add later once the basics work, and both cost money from the first hour.

## 3. CI/CD (GitHub Actions)

You're already on GitHub, so GitHub Actions is the natural fit (generous free minutes, no separate service to set up). Pipeline shape, mirroring the manual steps from phase 2:
1. On push to `main`/`dev`: build the Docker images.
2. Push them to ECR.
3. Deploy step: SSH into the EC2 instance, pull the new images, `docker compose up -d` to restart with the new version.

Deliberately simple for a first pipeline — no blue/green, no ECS orchestration yet. Once this basic version works reliably, moving the "run containers" part from raw EC2 + docker-compose to **ECS** (still AWS, still can stay in/near free tier with the EC2 launch type) is a natural next step, not a prerequisite.

## 4. Logging & metrics

Two honestly separate tracks — pick based on how deep you want to go:

- **Simple path**: ship container logs to **CloudWatch Logs** (the Docker CloudWatch logging driver, or the CloudWatch agent on the EC2 instance), and use CloudWatch's built-in EC2 metrics (CPU, memory, disk) — zero app code changes required, just infra configuration.
- **Deeper path**: replace raw `console.log` in the backend with structured logging (e.g. `pino` or `winston` — timestamps, log levels, JSON output instead of plain strings), and add application-level metrics (request counts, error rates, latency) — either as custom CloudWatch metrics, or in Prometheus format (`prom-client`) if you want to learn that ecosystem instead. This track is meaningfully more work and is really a separate learning project of its own once the simple path is in place.

---

## Email-template-ssr — relational DB decision

Noted: `url_shortener` used MongoDB (NoSQL) — that ground is covered. `email-template-ssr` will use a **relational** database instead, specifically so you get SQL/schema-migration experience this project hasn't touched yet. On AWS, that's **RDS** (free tier: 750 hrs/month of `db.t3.micro`/`db.t4g.micro` for 12 months) — Postgres is the more modern default if you don't have a preference already, though MySQL is equally free-tier eligible. This becomes relevant once that project moves past planning into actual scaffolding.
