# 1. 베이스 이미지
FROM node:18-alpine AS base

# 2. 작업 디렉토리
WORKDIR /usr/src/app

# 3. 패키지 설치 (캐시 활용)
COPY package*.json ./
RUN npm install --production

# 4. 소스 복사
COPY . .

# 5. (선택) 빌드 타임 기본값 설정
#    .env가 없을 때만 이 기본값을 사용합니다.
# ARG PORT=5000
# ENV PORT=${PORT}

# 6. 포트 개방
EXPOSE ${PORT:-5000}

# 7. 시작 명령
CMD ["node", "app.js"]