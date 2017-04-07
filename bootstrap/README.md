# Bootstrap

This section is used to bootstrap a new account, before any infrastructure exists.

This is currently a work in progress.

## Mandatory Manual Account Setup

### Configure the Account (root)

Login to the Account (root) should be rare after this procedure. The Account credentials should
be shared with very few people, as they allow complete and unrestricted access to everything in
the Account.

- Login as the Account (root), and configure the following:
  - Turn on Access to Billing Information
  - Configure the Security Questions
  - Create Account-level X509 Certificates and CloudFront Keys
  - Enable MFA on the Account
  - Configure the Password Policy for 20 characters, 1 upper, 1 lower, 1 number minimum
  - Customize the IAM users sign-in link with the account alias: irops
  - All of this information should be saved in the 1Password Team account or a similar 
    method to share credentials across key team members.
- Logout as the Account (root)

### Configure the BootstrapAdministrators Group and bootstrapadministrator User

This User will be used (by default) to create the remainder of the infrastructure.

- Login as the Account (root)
  - Confirm the MFA is working properly
  - Create the BootStrapAdministrators Group
    - Attach the AdministratorAccess Policy
  - Create the bootstrapadministrator User
    - Allow Programmatic Access
    - Allow AWS Management Console access
    - Add as a member of the BootstrapAdministrators Group
  - Enable MFA on the bootstrapadministrator User
  - Create an ssh key, using a secure passphrase (this must be run on a UNIX command line):
    ```bash
    ssh-keygen -t rsa -b 4096 -C bootstrap@iropshub.com -f ~/.ssh/irops_bootstrap_id_rsa
    ```
  - Import the bootstrap SSH public key as an EC2 KeyPair with the name "bootstrap"
- Logout as the Account (root)

### Configure the BootstrapUsers Group and bootstrapuser User

This User is intended only as a way to let new users get into the Bootstrap LinuxBastion for
initial setup, specifically to create their SSH key.

- Login as the bootstrapadministrator User
  - Confirm the MFA is working properly
  - Create the BootstrapUsers Group
    - Do not associate this Group with any Policies (only used for guest login)
  - Create the bootstrapuser User
    - Do not allow Programmatic Access
    - Do not allow AWS Management Console access
    - Add as a member of the BootstrapUsers Group
  - Create an ssh key, using a secure passphrase (this must be run on a UNIX command line):
    ```bash
    ssh-keygen -t rsa -b 4096 -C bootstrapuser@iropshub.com -f ~/.ssh/irops_bootstrapuser_id_rsa
    ```
  - Import the bootstrapuser SSH public key to the bootstrapuser User
    - This is under the User's Security credentials as "SSH keys for AWS CodeCommit"
- Logout as the bootstrapadministrator User

## Optional Manual Account Setup

The following additional steps can be run manually to create additional users on the 
bootstrap bastion host.

- Create additional members of the BootstrapAdministrators Group, using the same process above
- Except, use each person's normal ssh key (i.e. irops_mcrawford_id_rsa) when importing an SSH
  key into the corresponding bootstrap<user>'s (i.e. bootstrapmcrawford) User SSH keys

## Secure Shell Workstation Setup

The following steps can be run manually on a new account to prepare for both the initial bootstrap
process and additional per-user bootstrap actions once the system is up.

- Create the bootstrap-irops S3 bucket. This will hold the initial RoyalTS Document containing
  the bootstrap session, then once created, the additional bastions.
- New users who have credentials can use this document, along with the free version of RoyalTS,
  for access to the system of a better quality than using PuTTY.

## Create Bootstrap Bastion

### Create the Bootstrap-LinuxBastion CloudFormation Stack

This Stack creates the Bootstrap-LinuxBastion, a server which can be used to create the remainder
of the infrastructure. This server does not need to exist once the infrastructure has been created.

There are two methods to do this.

1.  Use a Linux Host or Virtual Machine, which has the irops-prototype project downloaded, and the 
    bootstrapadministrator access keys and bootstrap ssh key installed in the appropriate locations.
    This is the easiest and most robust method, and should be used if possible.
2.  Create the Bootstrap-LinuxBastion CloudFormation Stack manually, by uploading the Template and
    setting all properties by hand. This method is easier in that you don't need to have any existing
    Linux workstation, but harder in that more steps have to be performed, and the risk of human
    error is considerably higher.

### Configure a DNS record to allow login to the Bootstrap Bastion

There should be an initial Domain created within Route53, named iropshub.com. We need to create a 
single new record with the Public IP Address of the Bootstrap Bastion, named bootstrap.iropshub.com.

### Configure a Company Hosted Zone as a sub-domain of the top-level Domain

Each Company, or multi-tenant configuration, will have a 2nd-level domain name which needs to be
created and then setup as a delegation from the 1st-level domain. For the initial "Travel" Company
which will include smaller clients in a multi-tenant configuration, this is tvl.iropshub.com. This
should exist prior to creating the infrastructure.

## Login to Bootstrap LinuxBastion as a member of the BootstrapAdministrators Group

The bootstrapadministrator User, or another member of the BootstrapAdministrators Group, can login
to the Bootstrap LinuxBastion with their own ssh key and username.
