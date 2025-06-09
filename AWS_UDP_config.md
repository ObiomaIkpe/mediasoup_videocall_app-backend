# Configuring UDP Port Ranges for Mediasoup on AWS EC2

This guide outlines how to open the necessary UDP (User Datagram Protocol) port ranges in AWS EC2 Security Groups for a Mediasoup server. Mediasoup requires UDP for its real-time media traffic (RTP/RTCP).

## Prerequisites

* An AWS account.
* An existing (or newly launched) AWS EC2 instance where your Mediasoup backend server will run.

## Step-by-Step Configuration

### 1. Access Your EC2 Security Groups

1.  Log in to your [AWS Management Console](https://aws.amazon.com/console/).
2.  Navigate to the **EC2 service** dashboard.
3.  In the left-hand navigation pane, under **"Network & Security"**, click on **"Security Groups"**.

### 2. Identify or Create a Security Group

1.  **If you have an existing EC2 instance:** Locate and select the security group(s) associated with your EC2 instance. You can find this by going to your EC2 instance details, clicking on the "Security" tab, and then clicking on the security group's link (e.g., `sg-xxxxxxxx`).
2.  **If you are launching a new EC2 instance:** During the instance launch wizard, you will have a step to "Configure Security Group". You can create a new one here or select an existing one.

### 3. Edit Inbound Rules

1.  Select the **Security Group** you wish to modify from the list.
2.  In the details panel at the bottom, click on the **"Inbound rules" tab**.
3.  Click the **"Edit inbound rules"** button.

### 4. Add UDP Rules for Mediasoup

1.  Click the **"Add rule"** button.
2.  Configure the new rule as follows:
    * **Type:** Select **"Custom UDP Rule"**.
    * **Protocol:** This will automatically populate as `UDP`.
    * **Port range:** Enter your Mediasoup UDP port range. Based on your `config.js`, this is `40000-41000`.
    * **Source:**
        * For general access (e.g., if clients are connecting directly from the internet), choose **`Anywhere-IPv4 (0.0.0.0/0)`**.
        * You might also add `Anywhere-IPv6 (::/0)` if your clients support IPv6.
        * **Security Note:** In a production environment, if you have a known range of client IPs or are using a dedicated TURN server, you could restrict this source to specific IP CIDRs for enhanced security. However, for direct WebRTC media from unknown clients, `0.0.0.0/0` is often necessary for these specific media ports.
    * **(Optional) Description:** Add a clear description, e.g., "Mediasoup RTP/RTCP Media Traffic".

### 5. Add Other Essential Rules (if not already present)

While focusing on UDP, ensure your server can also be accessed for:

* **Your Node.js Application / Socket.IO Signaling:**
    * **Type:** `Custom TCP Rule`
    * **Protocol:** `TCP`
    * **Port range:** The port your Node.js server listens on (e.g., `3000`).
    * **Source:** `0.0.0.0/0` (or restricted to your frontend server's IP if applicable).
* **SSH Access (for server management):**
    * **Type:** `SSH`
    * **Protocol:** `TCP`
    * **Port range:** `22`
    * **Source:** Ideally, restrict this to `My IP` or a specific IP range you control. Avoid `0.0.0.0/0` for SSH.
* **Optional: HTTP/HTTPS (if your backend also serves web content):**
    * **Type:** `HTTP` (Port `80`, TCP, `0.0.0.0/0`)
    * **Type:** `HTTPS` (Port `443`, TCP, `0.0.0.0/0`)

### 6. Save Rules

1.  After adding all necessary inbound rules, click the **"Save rules"** button.

## Important Considerations

* **Elastic IP (EIP):** For production environments, it is highly recommended to allocate an [Elastic IP address](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html) and associate it with your EC2 instance. An EIP provides a static public IP address that won't change even if your instance is stopped and started. This stable IP is crucial for your Mediasoup `announcedIp` setting.
* **Outbound Rules:** By default, EC2 Security Groups usually allow all outbound traffic. For Mediasoup, this is generally sufficient as your server needs to send UDP traffic out to clients. You typically do not need to modify outbound rules unless specific security policies require it.
* **Network ACLs (NACLs):** Security Groups are stateful firewalls at the instance level. Network ACLs are stateless firewalls at the subnet level. For most Mediasoup deployments, correctly configured Security Groups are sufficient.
* **Cost:** Running EC2 instances incurs costs. Be mindful of the instance type you choose and your usage.

By properly configuring your Security Group's inbound rules, your AWS EC2 instance will be set up to allow the necessary UDP media traffic for your Mediasoup application to function correctly.