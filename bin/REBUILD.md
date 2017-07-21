# Rebuild Instructions

First see the README of this section on how to build a new account and any regions from scratch.

This page contains quick instructions on how to rebuild a MultiEnvironment (consisting of multiple
environments which are coordinated to work together, and which run in a Region), or to rebuild a
single Environment.

This is currently a work in progress. Please forgive the lack of proper documentation!

## Rebuild MultiEnvironment (Region)

We currently have 3 separate MultiEnvironments:

- Stable: In Oregon, which supports Production and the Development pipeline which feeds into
  Production.
- UnStable: In Ohio, used to test CloudFormation Templates, frequently torn down and rebuild to
  confirm all automation works as expected.
- Testing: In Ireland, used to train new Administrators on how to build all CloudFormation Stacks
  in a Region separate from production work or template development.

To tear down a MultiEnvironment prior to rebuilding it, you can use the appropriate MultiEnvironment's
delete sequence script, in this section, named:

- irops-delete-stable
- irops-delete-unstable
- irops-delete-training

Running these scripts will sequentially run the appropriate driver scripts to delete all Stacks
in the correct order.

While it's possible to run the delete script, running all driver scripts contained within each of them
to return a Region to a point where no Resources exist. This is usually not needed, and inefficient,
as deleting the S3 Buckets and SNS Topics and Subscriptions are either time-consuming to rebuild,
or will pester subscribers to re-subscribe. Also, deleting the VPN Connections will require
re-configuration of all Customer Gateways and VPN Configurations as these change each time they are
re-created.

So, in most cases, we will only want to partially run the delete script for a MultiEnvironment.
There are three use-cases, plus I'll list the fourth when you want to delete everything.

1. We want to delete All Application Resource in one or more Environments, but do not want to delete
   any infrastructure, including any Bastions (if used), any OpenVPN servers, or ActiveDirectory.

   To do this, run the delete script, running each driver script, until you get to the point where
   you're about to delete the OpenVPN Stacks, and stop there. Then, run the create scripts, skipping
   over the Stacks which you left running (though OpenVPN), and resume running creation driver scripts
   just after OpenVPN.

2. We want to delete Most Resources in All Environments, but do not want to delete the VPCs, any
   VPN Connections configured to work with them and CustomerGateways. We're OK leaving the SNS
   Topics and Subscriptions, Lambda Functions, VPCs, NetworkAcls, CustomerGateways and VPN Connections.
   But, we do want to rebuild the ActiveDirectory Domain Controllers and OpenVPN Servers.

   To do this, run the delete script, running each driver script, until you get to the point where
   you're about to delete the VPC Peering Connections, and stop there. Then, run the create scripts, skipping
   over the Stacks which you left running (though VPC Peering), and resume running creation driver scripts
   just after VPC Peering Connections.

3. We want to delete everything possible in a MultiEnvironment, leaving only the S3 buckets containing
   Products, Configurations, Scripts and Templates, and the SNS Topics and Subscriptions. This is as
   close to starting with a clean slate as possible without having to recreate S3 buckets which may
   be time-consuming to restore.

   To do this, run the delete script, running each driver script, until you get to the point where
   you're about to delete the S3 buckets, and stop there. Then, run the create scripts, skipping
   over the Stacks which you left running (through S3 Buckets), and resume running creation driver
   scripts just after buckets.

4. We want to delete everything possible in a MultiEnvironment, leaving nothing. This returns the
   environment to the same condition as it would be in a new account.

   To do this, run the delete script, running each driver script, until it completes.

Once you have deleted existing Stacks down to the point where you want to stop, you can use the
appropriate MultiEnvironment's create sequence script, in this section, named:

- irops-create-stable
- irops-create-unstable
- irops-create-training

Running these scripts will sequentially run the appropriate driver scripts to create all Stacks
in the correct order.

### Additional Manual Actions Required When Deleting and/or Creating a MultiEnvironment

The create and delete sequence scripts will run the corresponding create or delete driver scripts,
which prepare and call the AWS create-stack or delete-stack operations, with the correct parameters
for each environment, in the correct order to ensure dependencies needed by higher stacks are created
before they're referenced.

However, there are some manual actions which must be performed while running both the create and
delete sequence scripts. If these manual actions are not performed while running the create script,
later steps in the sequence will fail as required content will be missing, or DNS will not be fully
configured. If these manual actions are not performed while running the delete script, later steps
in the sequence will fail due to inter-stack dependencies which remain, or resources will be left in
the account, preventing recreation of the MultiEnvironment, as well as on-going costs for such
resources.

The sequence scripts generally emit a message to indicate when such manual actions should be performed,
but a list of them will be repeated here for additional reference.

#### Manual Steps Required During the Creation of a MultiEnvironment

1. Once the SNS Topics and Subscriptions are created, each subscriber MUST confirm the subscription.
   If unconfirmed subscriptions remain when an associated SNS Topic is deleted, this can prevent
   the recreation of the Topic and Subscriptions when the MultiEnvironment is rebuilt. Before deleting
   any SNS Topics and Subscriptions, ensure all Subscriptions have been confirmed.

2. Once the S3 Buckets are created, content for the Applications, Configurations, Demos, Examples,
   Products, Scripts and Users buckets (as needed) must be restored. The easiest way to do this, is
   to keep the Stable, Unstable and optionally Training Buckets which exist in Oregon, Ohio and Ireland,
   respectively, in sync with each other and with Global, which exists in Virginia. I also recommend
   at least one synchronized copy of each bucket be kept by all System Administrators on their home
   computers as a backup. Confirm all buckets are in sync prior to deleting them. Then, once the
   Buckets are recreated, it's a simple process to use the aws s3 sync command to synch the Global
   or another Region's set of Buckets to the new Region's Buckets for this task.

3. Once the VPCs are created, along with the Public (usual) and/or Private (unusual) HostedZones
   created by the VPC Templates, sub-domain delegation records must be manually created in Route53.

   The following sub-domain delegations must exist for All MultiEnvironments.
   - iropshub.com must delegate to tvl.iropshub.com

   The following sub-domain delegations must exist for the Stable MultiEnvironment.
   - tvl.iropshub.com must delegate to us-west-2.tvl.iropshub.com (Production Public Domain)
   - us-west-2.tvl.iropshub.com must delegate to s.us-west-2.tvl.iropshub.com (Staging Public Domain)
   - us-west-2.tvl.iropshub.com must delegate to t.us-west-2.tvl.iropshub.com (Testing Public Domain)
   - us-west-2.tvl.iropshub.com must delegate to d.us-west-2.tvl.iropshub.com (Development Public Domain)
   - us-west-2.tvl.iropshub.com must delegate to c.us-west-2.tvl.iropshub.com (Core Public Domain)
   - us-west-2.tvl.iropshub.com must delegate to b.us-west-2.tvl.iropshub.com (Build Public Domain)

   The following sub-domain delegations must exist for the Unstable MultiEnvironment.
   - tvl.iropshub.com must delegate to us-east-2.tvl.iropshub.com (Production Public Domain)
   - us-east-2.tvl.iropshub.com must delegate to s.us-east-2.tvl.iropshub.com (Staging Public Domain)
   - us-east-2.tvl.iropshub.com must delegate to t.us-east-2.tvl.iropshub.com (Testing Public Domain)
   - us-east-2.tvl.iropshub.com must delegate to d.us-east-2.tvl.iropshub.com (Development Public Domain)
   - us-east-2.tvl.iropshub.com must delegate to c.us-east-2.tvl.iropshub.com (Core Public Domain)
   - us-east-2.tvl.iropshub.com must delegate to b.us-east-2.tvl.iropshub.com (Build Public Domain)

   The following sub-domain delegations must exist for the Training MultiEnvironment.
   - tvl.iropshub.com must delegate to eu-west-1.tvl.iropshub.com (Production Public Domain)
   - eu-west-1.tvl.iropshub.com must delegate to s.eu-west-1.tvl.iropshub.com (Staging Public Domain)
   - eu-west-1.tvl.iropshub.com must delegate to t.eu-west-1.tvl.iropshub.com (Testing Public Domain)
   - eu-west-1.tvl.iropshub.com must delegate to d.eu-west-1.tvl.iropshub.com (Development Public Domain)
   - eu-west-1.tvl.iropshub.com must delegate to c.eu-west-1.tvl.iropshub.com (Core Public Domain)
   - eu-west-1.tvl.iropshub.com must delegate to b.eu-west-1.tvl.iropshub.com (Build Public Domain)

4. Once the VPN Connections are created, the CustomerGateway ASA Firewalls must be configured to use
   them. This involves downloading the sample configuration for each connection, and modifying to to
   use the conventions for the ASA device. Additional work is usually needed to ensure no conflicts
   between multiple VPNConnections to the same CustomerGateway.

   Once an initial version of a converted ASA configuration script is created, it can normally be
   reused with only a modification to the Pre-Shared key statements if a VPNConnection must be dropped
   and recreated, assuming the CustomerGateway IP or routes do not change. If a VPC is dropped, and/or
   the CustomerGateway, a few more changes are also needed, but again the majority of the configuration
   can usually be re-used.

5. Once the ActiveDirectory Instances are created, we should confirm Both Active Directory Domain
   Controllers are operational, and change the Administrator Password for the First Domain Controller.
   We don't need to change the second Domain Controller's Administrator Password, as it is removed
   so the original value which can be obtained from the AWS console no longer works, during the process
   which adds it as a second controller.

   Note you can not perform these actions immediately, except via access over a site-to-site VPN
   Connection, as the OpenVPN Instance used for access via the Internet do not exist yet. I usually
   wait to perform this step until after the OpenVPN Stacks - built immediately after ActiveDirectory -
   are up.

   I also usually perform a few more actions on each Domain Controller, including:
   - I add icons for Domains & Trusts, Sites & Subnets, Users & Computers, the Certificate Authority
     and DNS to the taskbar, so these management applications can be easily accessed in a consistent
     manner.
   - I adjust the default TTL in the SOA record to 5 minutes (default is 1 hour), to minimize the
     time it takes for replacement records to show up in DNS query results.
   - Until automatic registration of Linux Server DNS addresses is added to the code, it's necessary
     to add all Linux server entries manually via the DNS interface on the Primary Domain Controller.
     Note that it can take as long as an hour in some cases before all such manually-created records
     are visible to all clients, due to slow Windows inter-site replication and/or DNS TTL issues.

6. Once the OpenVPN Instance has been created, we need to perform some manual configuration of the
   OpenVPN software to tighten security, configure basic settings, and add groups and users, then
   setup clients to use OpenVPN for access to each VPC.

   Note the default openvpn user password is a WELL KNOWN VALUE, visible in the source code, and
   this MUST be changed immediately or a very large risk of compromise of the entire environment will
   exist. The password should be changed within MINUTES of creating the OpenVPN Stack - please do not
   wait to perform this action!

   Here is the list of actions I perform on each OpenVPN Instance:
   - Using RoyalTS, configured to login to vpn.us-west-2.tvl.iropshub.com (Production, use same process
     for other environments) as the openvpnas user using the irops_administrator_id_rsa private key,
     first run "sudo su -" to switch to root, then run "passwd openvpn" to change the default openvpn
     password. We are currently using a 1Password for Teams Account to store sensitive configuration
     such as these passwords, in the Accounts Vault. Lookup the login for vpn.us-west-2.tvl.iropshub.com
     (openvpn), and copy that password and use this as the new openvpn Unix user password. OpenVPN
     uses PAM to obtain the openvpn user's password when logging into the website, so once this user's
     password is chagned at the OS level, it will also be used when logging into the OpenVPN configuration
     website. A different password is used for each OpenVPN Instance.
   - Using RoyalTS, configured to login to the https://vpn.us-west-2.tvl.iropshub.com:943/admin URL,
     Confirm the new openvpn password works. This website should be restricted to only a few well-known
     CIDRs when the stack is created, so it's never open to the world during this initial configuration
     process. Only the normal VPN endpoint is globally visible.
   - Again using RoyalTS, use the Administration GUI, once confirmed to work, to perform the following
     minimal configuration:
     - Add A Users group
     - Make the Users group the default group for new Users
     - Check the "Require user permissions record for VPN access" checkbox
     - Update the running configuration
     - Add an Administrators Group, with the Administration checkbox checked.
     - Change the openvpn user to be a member of the Administrators Group
     - Add myself (mcrawford) as a member of the Administrators Group, with the Admin checkbox checked
     - Set my own password
     - Update the running configuration
     - Repeat the preceeding 3 steps to add additional Administrators
     - Log out as openvpn, then login as myself to confirm my account works, and I can perform
       Administrative tasks, then logout
   - Configure my client to use the new OpenVPN Instance to access the VPC
     - If a new client is accessing OpenVPN for the first time, use a browser to hit
       https://vpn.us-west-2.tvl.iropshub.com/, and this will offer to install the OpenVPN client
       software. Because this is only done once, I don't have a clear memory of how this works, but
       I remember it being straightforward. I will only describe the more common process of adding
       a new OpenVPN connection to an existing installation of the client.
     - From the OpenVPN taskbar icon, select import->from server, and enter the name of the OpenVPN
       server, such as vpn.us-west-2.tvl.iropshub.com. This will prompt you for a username and password,
       and you should use your own username and password. Do not use the openvpn user. Because we need
       to use your own username and password here, this should have been confirmed to work in the
       prior set of OpenVPN GUI configuration steps. Until we go through any effort to setup a CA
       chain of trust, you will get a warning dialog box indicating the certificate is untrusted. It
       is safe to ignore this, and check the checkbox which prevents this check from occurring again.
     - From the OpenVPN taskbar icon, now select the connection, and highlight connect... to connect
       to the VPN. You will again see a warning dialog about an untrusted profile, which it is safe
       to accept. Confirm your VPN connection is established.
     - If these steps are performed just after the OpenVPN Stack is created, then only the OpenVPN
       Instance and the two ActiveDirectory Domain Controller Instances should exist in the VPC.
       This is the time when I would normally use RoyalTS to confirm access to both Domain Controllers
       as the StackAdmin user, change the primary Domain Controller Administrator password, and perform
       the other initial configuration steps as described above. Doing this also confirms the vpn is
       working as expected.

This completes the set of manual steps needed - from an infrastructure perspective - when creating an
entire new MultiEnvironment. Additional manual steps to configure and/or test Applications are needed
as the remaining Application stacks are created.

#### Manual Steps Required During the Deletion of a MultiEnvironment

1. It's likely due to the manual nature of the existing Instance Build and Configuration process,
   that manually-created resources are likely to exist within and/or on top of resources created by
   CloudFormation when Stacks creating foundational infrastructure are created. The presence of these
   additions is likely to prevent deletion of any Stacks containing Resources where they appear. It
   may be hard to know about and find these dependencies before you attempt to delete the Stack and
   have the deletion fail, to be prepared for that. I think it's likely that when running the delete
   sequence scripts, you will have errors related to this issue which will cause the process to fail,
   but with enough information to manually remove the dependency blocking the deletion. This fix will
   have to be done manually, then the delete sequence script should be re-run, skipping over steps
   completed successfully until you get back to the stack which failed, where you will pick up and
   start running the delete driver scripts again.

2. Prior to deleting the ActiveDirectory Instances, confirm any DNS delegations to use them are also
   deleted, or be aware this will break that delegation until ActiveDirectory is replaced on a rebuild.

3. Prior to deleting the VPN Connections, the CustomerGateway ASA Firewalls should be configured to
   remove the VPN configuration code added when the VPNs were implemented, or be aware all VPN links
   will stop working until the VPN Connections are replaced, and updated configurations are added.
   Replacement of any VPN Connection will always require modifications to the CustomerGateway configuration!
   At a minimum, new pre-shared keys will be generated, even if all other CIDRs and Routes remain the
   same.

4. Prior to deleting the VPCs, we must remove all records from the associated Route53 Pubilc and/or
   Private HostedZones, leaving only the zone's minimum own NS and SOA RecordSets. If this is not done
   in advance, the VPC Stack deletion will fail. Look to delete any NS records used to delegate from
   the tvl.iropshub.com parent to the production sub-domain, or from the production sub-domain to
   non-production sub-domains. See the instructions above on what sub-domain delegations to create, as
   what's listed there will need to be reversed.

5. Once the Stacks which create the S3 Buckets are deleted, the buckets themselves created by the Stacks
   will still remain - unassociated with any Stack - as a safety precaution. These buckets must be
   manually deleted using the AWS Console. You should confirm that all content which may need to be
   saved, or restored after the MultiEnvironment is rebuilt, has been synched to other corresponding
   buckets in one or two other regions, and/or folders on an Administrator computer. It is significantly
   faster to restore content to a bucket by synchronizing with another bucket in another Region, so
   that is the preferred backup method.

6. Prior to deleting any SNS Subscriptions, please make sure no subscriptions exist in an unconfirmed
   state. If you delete an unconfirmed subscription, then attempt to recreate the same Topic and
   subscription on a rebuild, this can cause problems we've seen that are very difficult to fix, even
   with the help of AWS support, due to bugs in the distributed nature of how AWS handles subscription
   confirmations. It's best to avoid this problem by confirming all subscriptions have been confirmed
   prior to deleting them.

This completes the set of manual steps needed - from an infrastructure perspective - when deleting an
entire new MultiEnvironment.
