'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Heading, Text, Badge, SimpleGrid, Card, CardBody, Flex, Button, HStack, Stat, StatLabel, StatNumber, Progress } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
  health_score: number;
  enabled: boolean;
}

interface Health {
  missions_running: number;
  missions_succeeded_24h: number;
  missions_failed_24h: number;
  steps_queued: number;
  online_agents: number;
  total_agents: number;
  health_score: number;
}

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
    ]).then(([floorData, healthData]) => {
      setFloor(floorData.floor);
      setHealth(healthData.health);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" p={8}>
        <Heading color="white">加载中...</Heading>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading color="white" size="lg">{floor?.display_name}</Heading>
          <Text color="gray.400">{floor?.company_name}</Text>
        </Box>
        <HStack>
          <Button colorScheme="gray" onClick={() => router.push('/')}>返回</Button>
          <Button colorScheme="blue" onClick={() => router.push(`/floor/${id}/studio`)}>Studio</Button>
          <Button colorScheme="purple" onClick={() => router.push(`/floor/${id}/boss`)}>Boss</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card bg="gray.800"><CardBody><Stat><StatLabel color="gray.400">状态</StatLabel><StatNumber><Badge colorScheme={floor?.status === 'running' ? 'green' : 'gray'}>{floor?.status}</Badge></StatNumber></Stat></CardBody></Card>
        <Card bg="gray.800"><CardBody><Stat><StatLabel color="gray.400">健康评分</StatLabel><StatNumber color="green.400">{floor?.health_score || 0}%</StatNumber><Progress value={floor?.health_score || 0} colorScheme="green" size="sm" mt={2}/></Stat></CardBody></Card>
        <Card bg="gray.800"><CardBody><Stat><StatLabel color="gray.400">运行任务</StatLabel><StatNumber color="blue.400">{health?.missions_running || 0}</StatNumber></Stat></CardBody></Card>
        <Card bg="gray.800"><CardBody><Stat><StatLabel color="gray.400">在线 Agent</StatLabel><StatNumber>{health?.online_agents || 0}/{health?.total_agents || 0}</StatNumber></Stat></CardBody></Card>
      </SimpleGrid>

      <Heading size="md" color="white" mb={4}>24小时统计</Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card bg="gray.800"><CardBody><Stat><StatLabel>成功</StatLabel><StatNumber color="green.400">{health?.missions_succeeded_24h || 0}</StatNumber></Stat></CardBody></Card>
        <Card bg="gray.800"><CardBody><Stat><StatLabel>失败</StatLabel><StatNumber color="red.400">{health?.missions_failed_24h || 0}</StatNumber></Stat></CardBody></Card>
        <Card bg="gray.800"><CardBody><Stat><StatLabel>排队</StatLabel><StatNumber color="yellow.400">{health?.steps_queued || 0}</StatNumber></Stat></CardBody></Card>
      </SimpleGrid>
    </Box>
  );
}
