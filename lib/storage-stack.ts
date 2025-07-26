import { Stack, StackProps } from "aws-cdk-lib";
import { EbsDeviceVolumeType, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { S3Bucket } from "aws-cdk-lib/aws-kinesisfirehose";
import { Key } from "aws-cdk-lib/aws-kms";
import { Domain, EngineVersion } from "aws-cdk-lib/aws-opensearchservice";
import { SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface StorageStackProps extends StackProps {
  vpc: Vpc;
}

export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // const s3 = new Bucket(this, `dms-storage-bucket-${this.account}`, {
    //   bucketName: `dms-storage-bucket-${this.account}`,
    //   enforceSSL: true,
    //   versioned: true,
    // });

    const openSearchDomain = new Domain(
      this,
      `mapsterious-opensearch-domain-${this.account}`,
      {
        domainName: "mapsterious",
        version: EngineVersion.OPENSEARCH_2_19,
        vpcSubnets: [
          {
            subnets: [props.vpc.privateSubnets[0]],
          },
        ],
        vpc: props.vpc,
        nodeToNodeEncryption: true,
        enforceHttps: true,
        encryptionAtRest: {
          enabled: true,
          kmsKey: new Key(
            this,
            `mapsterious-opensearch-kms-key-${this.account}`,
            {
              enableKeyRotation: true,
            }
          ),
        },
        ebs: {
          volumeSize: 10,
          volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
        },
        fineGrainedAccessControl: {
          masterUserName: "mapsterious_admin",
        },
        capacity: {
          dataNodeInstanceType: "t3.small.search",
          multiAzWithStandbyEnabled: false,
        },
      }
    );
  }
}
