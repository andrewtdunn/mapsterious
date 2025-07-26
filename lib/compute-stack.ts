import { Stack, StackProps } from "aws-cdk-lib";
import {
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface ComputeStackProps extends StackProps {
  vpc: Vpc;
}

const keyName = "mapsterious";

export class ComputeStack extends Stack {
  public readonly jumpboxSG: SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const key = KeyPair.fromKeyPairName(
      this,
      `mapsterious-keyPair-${this.account}`,
      keyName
    );

    this.jumpboxSG = new SecurityGroup(
      this,
      "mapsterious-jumpbox-sg-${this.account}",
      {
        vpc: props.vpc,
        allowAllOutbound: true,
        securityGroupName: `mapsterious-jumpbox-sg-${this.account}`,
      }
    );

    this.jumpboxSG.connections.allowFrom(Peer.anyIpv4(), Port.tcp(22), "ssh");

    const jumpbox = new Instance(this, "jumpbox", {
      vpc: props.vpc,
      instanceName: `mapsterious-jumpbox-${this.account}`,
      keyPair: key,
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE3,
        InstanceSize.MICRO
      ),
      machineImage: MachineImage.latestAmazonLinux2023(),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      securityGroup: this.jumpboxSG,
    });
  }
}
