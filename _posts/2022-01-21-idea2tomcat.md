---
layout: post
title: "IDEA源码调试Tomcat环境配置"
date: 2022-01-21
author: 2hanx
toc: true
categories: [IDEA]
tags: ["Tomcat", "环境配置"]
---

### 源码下载

- [Tomcat 官网下载源码链接](https://archive.apache.org/dist/tomcat/tomcat-7/v7.0.79/bin/)
- [Tomcat 官网下载发布程序链接](https://archive.apache.org/dist/tomcat/tomcat-7/v7.0.79/bin/)

源码解压后的文件目录

![3]({{ '/tomcat1/3.png' | prepend: site.url }})

发布版本解压后的文件目录

![4]({{ '/tomcat1/4.png' | prepend: site.url }})

> 下载相同版本的 tomcat，里面有需要的**lib**包

### 部署步骤

1. IDEA 专业版（2021.3）构建 Maven 项目

   ![1]({{ '/tomcat1/1.png' | prepend: site.url }})

   ![2]({{ '/tomcat1/2.png' | prepend: site.url }})

2. 复制代码

   - 将**源码**中的 *conf* 和 *webappas* 目录复制到新建项目根路径下，*java* 和 *modules* 目录复制到新建目录根路径下的 *\src\main* 目录；
   - 将**发布版本**中的 *lib* 目录复制到新建项目根路径下。

   最终新建项目复制代码后的目录结构是：

   ![5]({{ '/tomcat1/5.png' | prepend: site.url }})

3. 编辑**新建项目**根目录下的 *pom.xml*

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <project xmlns="http://maven.apache.org/POM/4.0.0"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
       <modelVersion>4.0.0</modelVersion>
   
       <groupId>com.apache</groupId>
       <artifactId>tomcatcode</artifactId>
       <version>1.0-SNAPSHOT</version>
       <build>
           <plugins>
               <plugin>
                   <groupId>org.apache.maven.plugins</groupId>
                   <artifactId>maven-compiler-plugin</artifactId>
                   <version>2.3</version>
                   <configuration>
                       <encoding>UTF-8</encoding>
                       <source>1.8</source>
                       <target>1.8</target>
                   </configuration>
               </plugin>
           </plugins>
       </build>
   
       <dependencies>
           <dependency>
               <groupId>org.easymock</groupId>
               <artifactId>easymock</artifactId>
               <version>3.4</version>
           </dependency>
           <dependency>
               <groupId>ant</groupId>
               <artifactId>ant</artifactId>
               <version>1.7.0</version>
           </dependency>
           <dependency>
               <groupId>wsdl4j</groupId>
               <artifactId>wsdl4j</artifactId>
               <version>1.6.2</version>
           </dependency>
           <dependency>
               <groupId>javax.xml</groupId>
               <artifactId>jaxrpc</artifactId>
               <version>1.1</version>
           </dependency>
           <dependency>
               <groupId>org.eclipse.jdt.core.compiler</groupId>
               <artifactId>ecj</artifactId>
               <version>4.5.1</version>
           </dependency>
       </dependencies>
   
   </project>
   ```

4. IDEA 中对新建项目引入模块

   打开 "文件-项目结构-项目设置-模块-项目名-依赖-添加-JAR或目录-全选该项目 *lib* 目录下的所有 jar 文件" ，导入成功后如下所示：

   ![6]({{ '/tomcat1/6.png' | prepend: site.url }})

5. IDEA 中对新建项目配置启动程序

   打开 "运行/调试设置-选择应用程序"，添加**主类**为：`org.apache.catalina.startup.Bootstrap`，添加**VM选项**为：`-Dcatalina.home="<新建项目根目录的绝对路径>"`，最终结果是：

   ![7]({{ '/tomcat1/7.png' | prepend: site.url }})

6. 启动 Tomcat

   默认访问地址： `http://localhost:8080`

   ![8]({{ '/tomcat1/8.png' | prepend: site.url }})

### 调试

#### 新建 JSP 文件

在根目录下的 *webapps/ROOT* 中新建 *dd.jsp* 文件，访问地址为： *http://localhost:8080/dd.jsp*

#### 新建网站目录

在项目根目录下的 *webapps* 中新建文件夹，创建如下图所示

![9]({{ '/tomcat1/9.png' | prepend: site.url }})

访问地址为： *http://localhost:8080/html-project/index.html*

或者给这个单独网站做配置，*WEB-INF/classes/MyServlet.class* 文件是 */src/main/java/MyServlet.java* 中创建并构建后从 */target/classes/MyServlet.class* 复制而来，*MyServlet.java* 内容如下：

```java
// /src/main/java/MyServlet.java
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class MyServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().write("Hello World");
    }
}
```

之后在 *WEB-INF/web.xml* 中做映射，内容如下:

```xml

<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                      http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">

    <servlet>
        <servlet-name>zhangsan</servlet-name>
        <servlet-class>MyServlet</servlet-class>
    </servlet>

    <servlet-mapping>
        <servlet-name>zhangsan</servlet-name>
        <url-pattern>*.abc</url-pattern>
    </servlet-mapping>

</web-app>
```

最终访问地址为：*http://localhost:8081/html-project/gg.abc*

### 其他

1. 更改监听端口

   更改项目根目录下的 *conf/server.xml*  文件，修改端口为 *8081* ：

   ```xml
   <Connector port="8081" protocol="HTTP/1.1" 
   	connectionTimeout="20000"
   	redirectPort="8443" />
   ```

   之后在 IDEA 中重新运行即可。

2. 查看web访问日志

   访问日志存放在项目根目录 *logs* 目录下

### Ref.

- https://zhuanlan.zhihu.com/p/35454131
- https://blog.csdn.net/github_26672553/article/details/78986725
