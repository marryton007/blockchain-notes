# proxmox 集群搭建

1. ## 背景
   刚到公司的时候，公司分了一台服务器，非常开心的装了Centos7，跑了几个服务：
   * GETH 私链
   * BTC 测试网络
   * BTC 私链
   * EOS 测试网络
   * ...

   随着服务的增多，悲剧了，各个服务依赖的库、工具和服务不同，在一个环境里容易混乱，逐考虑使用虚拟机(VM)或是容器来进行管理。这里有2个选择：
   * K8S(Kubernetes)
   * Proxmox
  
   这里先不说K8S，相对而言K8S比较复杂，短时间难以上手，以后有时间再弄。本人是无意中看到有人在玩Proxmox的，proxmox本身概念比较简单，就一个管理KVM和LXC容器的平台，基于Debian制作，使用也简单，通过WEB界面就能完成绝大部分的工作；本人认为Proxmox的文档和论坛也比较友好，写得简单易懂。基于这些优点，Proxmox上手非常快，我也才折腾了2周。

2. ## 准备
   这里准备3台机器，分别为：
   * pve1  192.168.50.237
   * pve2  192.168.50.236
   * pve3  192.168.50.159
   3台机器, 128G SSD + 1T HDD, 16G内存，分配好静态IP。

3. ## 安装
   下载[proxmox官网][proxmox]最新版IOS镜像(5.2), 使用[烧录工具etcher][etcher]写入U盘，使用U盘安装Proxmox系统， 统一安装在SSD上，安装过程不到10分钟，最重要的是设置好密码和网络信息。

4. ## 集群
   随便选1台机器做主控机，这里使用pve1, 先进入pve1的终端命令控制台，直接登录或SSH都可。

   ```shell
   pvecm create YOUR-CLUSTER-NAME
   ```

   依次进入其他机器, 执行如下命令：

   ```shell
   pvecm add 192.168.50.237(pve1 ip)
   ```

   回到pve1, 查看集群状态, 如果是如下状态，基本上可以了。

   ```shell
    root@pve1:~# pvecm status
    Quorum information
    ------------------
    Date:             Fri Sep 21 20:05:24 2018
    Quorum provider:  corosync_votequorum
    Nodes:            3
    Node ID:          0x00000001
    Ring ID:          3/216
    Quorate:          Yes

    Votequorum information
    ----------------------
    Expected votes:   3
    Highest expected: 3
    Total votes:      3
    Quorum:           2
    Flags:            Quorate

    Membership information
    ----------------------
        Nodeid      Votes Name
    0x00000003          1 192.168.50.159
    0x00000002          1 192.168.50.236
    0x00000001          1 192.168.50.237 (local)
   ```

    打开pve1的web控制台，即可看到3台机器了。

    ```shell
    https://192.168.50.237:8006
    ```

    ![全局图](img/big-picture.png)

5. ## 添加NFS存储和Disk
   * NFS
    在Web控制台使用如下方式添加NFS存储，创建好的NFS是会在集群中共享的，即任何一个节点都可访问该NFS存储  
    Datacenter -->  Storage --> NFS 在弹出的对话框中，添加NFS服务地址及导出的路径，最后确认即可。

    ![nfs1](img/nfs1.png)  

    ![nfs](img/nfs.png)  

   * Disk
    在Web控制台上添加Disk
    pve1 --> Disks --> LVM  --> Create: Volume Group 在弹出的对话框中，选择未使用的HDD硬盘(要求硬盘未分区，如果有，请先使用Fdisk工具抹除分区信息表)，添加即可。

    ![disk1](img/disk.png)  

    ![disk2](img/disk2.png)  

6. ## 上传iso镜像和下载lxc容器模板  
   在新建虚拟机(VM)和Lxc容器之前，需要先下载好相关的ISO镜像或是容器模板  
   * iso 镜像  
   在Web控制台上传ISO镜像
   nfs(pve1) --> Upload --> select file(选择要上传的ISO镜像文件) --> 点击upload  
   ![upload](img/upload.png)  
   ![uplaod2](img/upload2.png)  

   * lxc模板
   在Web控制台下载lxc模板
   nfs(pve1) --> Templates --> 选择要下载的模板 --> download
   ![lxc](img/lxc.png)  
   ![lxc2](img/lxc2.png)

7. ## 创建VM和Lxc，启动，停止，克隆
   * 创建虚拟机(VM)
    Web控制台--> Create VM(右上角) --> 按向导操作，依次选定如下信息：
    1. general, 一般信息，主要设置VM名称，其他保持默认就好  
    2. OS，操作系统，这里会用到前面上传ISO镜像
    3. Disk，设定磁盘大小
    4. CPU，设定CPU及核数量
    5. Memory，设定内存大小
    6. Network，设定网络类型，是静态IP叿DHCP等
    7. Finish, 创建完成  
    ![Create](img/create.png)  
    ![Create](img/create2.png)  

   * 创建容器(lxc container)
    创建容器过程与VM创建过程类似，有少许不同，Web控制台--> Create CT(右上角) --> 按向导操作，依次选定如下信息：
    1. general，一般信息，须设定hostname，root密码等
    2. template， 选择前面下载好的模板
    3. Root Disk， 根磁盘，设定大小
    4. CPU
    5. Memory
    6. Network
    7. DNS
    8. Confirm & finish  
    ![lxc_create](img/lxc-create.png)  
    ![lxc_create2](img/lxc-create2.png)  
   * 启动，停止与克隆
    1. 在左侧列表中选择1台VM或容器
    2. 点击右上角相关按钮  
    ![lxc_create2](img/control.png)  

8. ## FAQ
    * 为什么不使用Ceph分布式文件系统  
    答： Ceph看起来很美好，但在资源有限环境中不建议使用，我原来也把ceph折腾到Proxmox集群里了，但后面发现非常卡，甚至还不如本地磁盘的性能，所以就删除了Ceph

    * 如何快速克隆
    答： Proxmox自带的克隆比较慢，对虚拟机(VM)的克隆推荐使用[clonezilla][clonezilla]，其类似于windows上的ghost(磁盘克隆工具)，使用办法是先下载[clonezilla][clonezilla]的镜像，替换VM的光驱镜像，设定VM从光驱引导即可。  

9. ## 资源
   * [proxmox官网][proxmox]
   * [烧录工具etcher][etcher]
   * [clonezilla][clonezilla]

[proxmox]:https://www.proxmox.com/en/
[etcher]:https://etcher.io/
[clonezilla]:https://clonezilla.org/downloads/download.php?branch=stable
