'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Heading, Text, Badge, SimpleGrid, Card, CardBody, Flex, Button, VStack } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
  health_score: number;
  last_heartbeat_at: string | null;
  enabled: boolean;
  timezone: string;
  floor_group: string;
}

interface Health {
  missions_running: number;
  missions_succeeded_24h: number;
  missions_failed_24h: number;
  steps_queued: number;
  steps_running: number;
  online_agents: number;
  total_agents: number;
  health_score: number;
}

const statusColors: Record<string, string> = {
  empty: 'gray',
  configured: 'blue',
  provisioning: 'yellow',
  running: 'green',
  warning: 'orange',
  stopped: 'red',
};

const statusLabels: Record<string, string> = {
  empty: '未配置',
  configured: '已配置',
  provisioning: '初始化中',
  running: '运行中',
  warning: '异常',
  stopped: '已停止',
};

export default function FloorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [floor, setFloor] = useState<Floor | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    Promise.all([
      fetch(`/api/floor/${id}`).then(r => r.json()),
      fetch(`/api/floor/${id}/health`).then(r => r.json())
    ])
    .then(([floorData, healthData]) => {
      setFloor(floorData.floor);
      setHealth(healthData.health);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" p={8}>
        <Heading color="white">加载中...</Heading>
      </Box>
    );
  }

  if (!floor) {
    return (
      <Box minH="100vh" bg="gray.900" p={8}>
        <Heading color="red.400">楼层不存在</Heading>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading color="white" size="lg">
            {floor.display_name}
          </Heading>
          <Text color="gray.400">{floor.company_name}</Text>
        </Box>
        <Badge 
          colorScheme={statusColors[floor.status] || 'gray'}
          fontSize="lg"
          px={4}
          py={2}
        >
          {statusLabels[floor.status] || floor.status}
        </Badge>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg="gray.800">
          <CardBody>
            <Text color="gray.500" fontSize="sm">健康评分</Text>
            <Text 
              color={floor.health_score > 70 ? 'green.400' : floor.health_score > 40 ? 'yellow.400' : 'red.400'} 
              fontSize="3xl" 
              fontWeight="bold"
            >
              {floor.health_score}%
            </Text>
          </CardBody>
        </Card>
        
        <Card bg="gray.800">
          <CardBody>
            <Text color="gray.500" fontSize="sm">运行中任务</Text>
            <Text color="white" fontSize="3xl" fontWeight="bold">
              {health?.missions_running || 0}
            </Text>
          </CardBody>
        </Card>
        
        <Card bg="gray.800">
          <CardBody>
            <Text color="gray.500" fontSize="sm">在线 Agent</Text>
            <Text color="white" fontSize="3xl" fontWeight="bold">
              {health?.online_agents || 0} / {health?.total_agents || 6}
            </Text>
          </CardBody>
        </Card>
        
        <Card bg="gray.800">
          <CardBody>
            <Text color="gray.500" fontSize="sm">队列深度</Text>
            <Text color="white" fontSize="3xl" fontWeight="bold">
              {health?.steps_queued || 0}
            </Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg="gray.800" mb={8}>
        <CardBody>
          <Heading size="md" color="white" mb={4}>详细信息</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Box>
              <Text color="gray.500" fontSize="sm">时区</Text>
              <Text color="white">{floor.timezone}</Text>
            </Box>
            <Box>
              <Text color="gray.500" fontSize="sm">分组</Text>
              <Text color="white">{floor.floor_group}</Text>
            </Box>
            <Box>
              <Text color="gray.500" fontSize="sm">最后心跳</Text>
              <Text color="white">
                {floor.last_heartbeat_at 
                  ? new Date(floor.last_heartbeat_at).toLocaleString('zh-CN')
                  : 'N/A'
                }
              </Text>
            </Box>
            <Box>
              <Text color="gray.500" fontSize="sm">启用状态</Text>
              <Badge colorScheme={floor.enabled ? 'green' : 'gray'}>
                {floor.enabled ? '已启用' : '已禁用'}
              </Badge>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      <VStack spacing={4} align="stretch">
        <Button colorScheme="blue" size="lg" onClick={() => router.push(`/floor/${id}/studio`)}>
          进入 Studio
        </Button>
        <Button colorScheme="orange" size="lg" onClick={() => router.push(`/floor/${id}/config`)}>
          进入 Config
        </Button>
        <Button colorScheme="purple" size="lg" onClick={() => router.push(`/floor/${id}/boss`)}>
          进入 Boss
        </Button>
      </VStack>
    </Box>
  );
}
