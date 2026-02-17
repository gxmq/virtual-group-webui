'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Heading, Text, Badge, SimpleGrid, Card, CardBody, Flex, Button, VStack, HStack, Input, Textarea, Divider } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
}

interface Proposal {
  id: string;
  agent_id: string;
  title: string;
  priority: number;
  status: string;
  created_at: string;
}

export default function BossPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/floor/${id}`)
      .then(r => r.json())
      .then(data => {
        setFloor(data.floor);
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

  return (
    <Box minH="100vh" bg="gray.900" p={8}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading color="white" size="lg">
            {floor?.display_name} - Boss
          </Heading>
          <Text color="gray.400">{floor?.company_name} - 控制中枢</Text>
        </Box>
        <Button colorScheme="gray" onClick={() => router.push(`/floor/${id}`)}>
          返回
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* 左栏：Inbox */}
        <Card bg="gray.800" gridColumn="span 1">
          <CardBody>
            <Heading size="md" color="white" mb={4}>📥 待决策 Inbox</Heading>
            <VStack align="stretch" spacing={3}>
              <Box p={3} bg="gray.700" borderRadius="md" borderLeftWidth="4px" borderLeftColor="yellow.400">
                <Text color="white" fontWeight="bold" fontSize="sm">提案标题示例</Text>
                <Text color="gray.400" fontSize="xs">by Analyst • 优先级 7</Text>
                <HStack mt={2}>
                  <Button size="xs" colorScheme="green">批准</Button>
                  <Button size="xs" colorScheme="red">拒绝</Button>
                </HStack>
              </Box>
              <Text color="gray.500" fontSize="sm" textAlign="center">暂无更多提案</Text>
            </VStack>
          </CardBody>
        </Card>

        {/* 中栏：任务看板 */}
        <Card bg="gray.800" gridColumn="span 1">
          <CardBody>
            <Heading size="md" color="white" mb={4}>📊 任务全景</Heading>
            <SimpleGrid columns={2} spacing={4}>
              <Box p={4} bg="green.900" borderRadius="md" textAlign="center">
                <Text color="green.400" fontSize="2xl" fontWeight="bold">0</Text>
                <Text color="gray.400" fontSize="sm">进行中</Text>
              </Box>
              <Box p={4} bg="red.900" borderRadius="md" textAlign="center">
                <Text color="red.400" fontSize="2xl" fontWeight="bold">0</Text>
                <Text color="gray.400" fontSize="sm">失败</Text>
              </Box>
              <Box p={4} bg="blue.900" borderRadius="md" textAlign="center">
                <Text color="blue.400" fontSize="2xl" fontWeight="bold">0</Text>
                <Text color="gray.400" fontSize="sm">待处理</Text>
              </Box>
              <Box p={4} bg="purple.900" borderRadius="md" textAlign="center">
                <Text color="purple.400" fontSize="2xl" fontWeight="bold">0</Text>
                <Text color="gray.400" fontSize="sm">已完成</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* 右栏：快速指令 */}
        <Card bg="gray.800" gridColumn="span 1">
          <CardBody>
            <Heading size="md" color="white" mb={4}>⚡ 快速指令</Heading>
            <VStack align="stretch" spacing={3}>
              <Button colorScheme="blue" size="sm">🚀 发起任务</Button>
              <Button colorScheme="purple" size="sm">💬 开始会议</Button>
              <Button colorScheme="orange" size="sm">🔄 触发 Heartbeat</Button>
              <Button colorScheme="red" size="sm">🛑 停止所有任务</Button>
              <Divider borderColor="gray.600" />
              <Text color="gray.400" fontSize="sm">快捷操作开发中...</Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
