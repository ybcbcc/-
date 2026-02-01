I will implement the backend features for the `wxxcx` project based on the `wxcloudrun-golang` template.

### 1. Database Models (`db/model`)
I will create the following models to match the schema requirements:
- `UserModel`: Stores OpenID, nickname, avatar, points, member status, and a session token.
- `LotteryModel`: Stores activity details (title, desc, status, probability).
- `RecordModel`: Stores lottery draw records.
- `PostModel`: Stores user posts (desc, image, location, status).

### 2. Database Initialization (`db/init.go`)
- Update `Init()` to automatically migrate these new schemas using GORM's `AutoMigrate`.

### 3. DAO Layer (`db/dao`)
- Extend the `CounterInterface` (or create a new one) to include methods for:
  - **User**: `GetUserByOpenID`, `CreateUser`, `UpdateUser`, `GetUserByToken`.
  - **Lottery**: `GetActiveLotteries`, `GetLotteryByID`.
  - **Record**: `CreateRecord`, `GetUserRecords`.
  - **Post**: `CreatePost`, `GetPosts`, `GetUserPosts`.
- Implement these methods using GORM.

### 4. Service Layer (`service/`)
- **Auth Service**: `LoginHandler` - Exchanges code for OpenID (mocking the WeChat API call if necessary or implementing the HTTP request), creates/updates user, returns token.
- **Home Service**: `HomeListHandler` - Aggregates lotteries and posts.
- **Lottery Service**: `LotteryDetailHandler`, `LotteryDrawHandler` (logic for probability and point deduction).
- **Post Service**: `UploadHandler` (local file save), `CreatePostHandler`.
- **User Service**: `UserInfoHandler`, `UserHistoryHandler`, `MemberInfoHandler`.

### 5. Main Application (`main.go`)
- Register all the new API routes:
  - `/api/auth/login`
  - `/api/home/list`
  - `/api/lottery/detail`, `/api/lottery/draw`
  - `/api/upload`, `/api/post/create`
  - `/api/user/info`, `/api/user/lottery-history`, `/api/user/publish-history`, `/api/member/info`
- Serve the `/uploads` directory for accessing uploaded files.

### 6. Dependencies
- I will use standard libraries where possible.
- I will assume `MYSQL_ADDRESS`, `MYSQL_PASSWORD`, `MYSQL_USERNAME` are set in the environment (as per the template).
