import { Stack, StackProps } from "aws-cdk-lib";
import { EbsDeviceVolumeType, Vpc } from "aws-cdk-lib/aws-ec2";
import { S3Bucket } from "aws-cdk-lib/aws-kinesisfirehose";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface StorageStackProps extends StackProps {
  vpc: Vpc;
}

export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const s3 = new Bucket(this, `dms-storage-bucket-${this.account}`, {
      bucketName: `dms-storage-bucket-${this.account}`,
      enforceSSL: true,
      versioned: true,
    });

    const openSearchDomain = new Domain(
      this,
      `mapsterious-opensearch-domain-${this.account}`,
      {
        version: EngineVersion.OPENSEARCH_2_19,
        enforceHttps: true,
        nodeToNodeEncryption: true,
        vpc: props.vpc,
        vpcSubnets: [{ subnets: props.vpc.privateSubnets }],
        encryptionAtRest: {
          enabled: true,
        },
        ebs: {
          volumeSize: 10,
          volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
        },
        capacity: {
          multiAzWithStandbyEnabled: false,
          masterNodes: 2,
          dataNodes: 2,
        },
        fineGrainedAccessControl: {
          masterUserName: "mapsterious_admin",
        },
      }
    );
  }
}
