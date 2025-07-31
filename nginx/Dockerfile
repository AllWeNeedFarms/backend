# 베이스가 될 공식 Nginx 이미지를 지정합니다. 가볍고 안정적인 alpine 버전을 사용합니다.
FROM nginx:alpine

# 로컬의 nginx.conf 파일을 컨테이너 내부의 /etc/nginx/nginx.conf 경로로 복사합니다.
# 이 한 줄을 통해 공식 Nginx 이미지가 우리의 설정을 담은 커스텀 이미지로 변신합니다.
COPY nginx.conf /etc/nginx/nginx.conf