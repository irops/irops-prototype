# Bin

This section contains scripts which define the environment variables needed to run driver
scripts in other sections one-by-one, or scripts which sequentially create the Global 
foundation or Stable, Unstable, Training or Demo MultiEnvironments.

This is currently a work in progress. Please forgive the lack of proper documentation!

## Creation on a new Implementation of this Prototype

### Create the Global Resources

There is a set of Templates that create Global Resources which must be created before
any other MultiEnvironments can be created. These Global Stacks must be created in the
us-east-1 Region, or we create them there because only a single copy of the Stack can
exist.

```bash
mkdir ~/src/irops
git clone https://github.com/irops/irops-prototype.git
cd ~/src/irops/irops-prototype/bin
./irops-create-global
```

### Create the Stable MultiEnvironment

Each MultiEnvironment consists of a set of VPCs which correspond to what most developers
consider an Environment: Production, Staging, Testing or Development, each containing a
clone of the code at different stages of the development and release process. In addition,
two additional Environment are used: Core, containing shared Resources not dedicated to 
a single traditional Environment, and Build, containing Resources used to build code or
Infrastructure used in the entire MultiEnvironment.

Separate MultiEnvironments are needed to allow for complete tear-down and rebuild of all
Environments to continuously verify that all CloudFormation Templates and build processes
remain in working condition. This is not possible with a single MultiEnvironment, as 
Production must continue to run, Development and Testing must continue without interruption,
Builds must continue to be performed, etc.

The Stable MultiEnvironment is the MultiEnvironment where live production and development
occurs.

```bash
cd ~/src/irops/irops-prototype/bin
./irops-create-stable
```

### Create the Unstable MultiEnvironment

The Unstable MultiEnvironment is the MultiEnvironment where destructive and unstable 
development and testing of the CloudFormation Templates and Build Pipelines occur.

```bash
cd ~/src/irops/irops-prototype/bin
./irops-create-unstable
```

### Create the Training MultiEnvironment

The Training MultiEnvironment is the MultiEnvironment where training on the procedure to
create and delete entire MultiEnvironments occurs. It is used by new Solution Architects
and System Administrators to understand how things work in practice.

```bash
cd ~/src/irops/irops-prototype/bin
./irops-create-training
```
