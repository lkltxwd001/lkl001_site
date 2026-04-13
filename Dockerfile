FROM ubuntu:24.04

# 安装 nginx 和 git
RUN apt update && apt install -y nginx git && \
    rm -rf /var/lib/apt/lists/*

# 修改 nginx 默认目录为 /workspace
RUN sed -i 's|/var/www/html|/workspace|g' /etc/nginx/sites-available/default

# 配置 Git
RUN git config --global user.name "lkltxwd001" && \
    git config --global user.email "lkltxwd001@gmail.com"

# 暴露端口
EXPOSE 80

# 启动 nginx（前台运行）
CMD ["nginx", "-g", "daemon off;"]