'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Heading, Text, Badge, SimpleGrid, Card, CardBody, Flex, Button, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
  health_score: number;
}

const agents = [
  { id: 'boss', name: 'Boss', role: '项目经理', status: 'idle', color: 'red' },
  { id: 'analyst', name: 'Analyst', role: '数据分析师', status: 'idle', color: 'blue' },
  { id: 'hustler', name: 'Hustler', role: '增长专家', status: 'idle', color: 'green' },
  { id: 'writer', name: 'Writer', role: '内容创作者', status: 'idle', color: 'purple' },
  { id: 'wildcard', name: 'Wildcard', role: '创意顾问', status: 'idle', color: 'orange' },
  { id: 'observer', name: 'Observer', role: '系统观察员', status: 'idle', color: 'cyan' },
];

const statusColors: Record<string, string> = {
  idle: 'gray',
  thinking: 'blue',
  working: 'green',
  waiting: 'yellow',
};

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [floor, setFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);

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
            {floor?.display_name} - Studio
          </Heading>
          <Text color="gray.400">{floor?.company_name} - 工作区</Text>
        </Box>
        <Button colorScheme="gray" onClick={() => router.push(`/floor/${id}`)}>
          返回
        </Button>
      </Flex>

      {/* 像素办公室 */}
      <Card bg="gray.800" mb={8}>
        <CardBody>
          <Heading size="md" color="white" mb={4}>🤖 AI Agent 办公室</Heading>
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
            {agents.map((agent) => (
              <Box 
                key={agent.id}
                p={4}
                bg="gray.700"
                borderRadius="md"
                borderWidth="2px"
                borderColor={agent.status === 'idle' ? 'gray.600' : `${agent.color}.400`}
                textAlign="center"
              >
                <Text fontSize="2xl" mb={2}>🤖</Text>
                <Text color="white" fontWeight="bold" fontSize="sm">{agent.name}</Text>
                <Text color="gray.400" fontSize="xs">{agent.role}</Text>
                <Badge mt={2} colorScheme={statusColors[agent.status]} fontSize="xs">
                  {agent.status}
                </Badge>
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Tab 切换 */}
      <Tabs colorScheme="blue">
        <TabList>
          <Tab color="gray.400">项目</Tab>
          <Tab color="gray.400">运营</Tab>
          <Tab color="gray.400">资产</Tab>
        </TabList>

        <TabPanels>
          {/* 项目视图 */}
          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>📋 项目看板</Heading>
                <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                  {['待办', '进行中', '测试', '待交付', '已完成'].map((stage) => (
                    <Box key={stage} p={4} bg="gray.700" borderRadius="md">
                      <Text color="gray.300" fontWeight="bold" mb={2}>{stage}</Text>
                      <Text color="gray.500" fontSize="sm">0 个项目</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          </TabPanel>

          {/* 运营视图 */}
          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>⚙️ 运营状态</Heading>
                <Table variant="simple" color="gray.300">
                  <Thead>
                    <Tr>
                      <Th color="gray.400">类型</Th>
                      <Th color="gray.400">状态</Th>
                      <Th color="gray.400">数量</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Missions</Td>
                      <Td><Badge colorScheme="green">running</Badge></Td>
                      <Td>0</Td>
                    </Tr>
                    <Tr>
                      <Td>Steps</Td>
                      <Td><Badge colorScheme="yellow">queued</Badge></Td>
                      <Td>0</Td>
                    </Tr>
                    <Tr>
                      <Td>Events</Td>
                      <Td><Badge colorScheme="blue">active</Badge></Td>
                      <Td>0</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* 资产视图 */}
          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>💎 资产</Heading>
                <VStack align="stretch" spacing={4}>
                  <Box p={4} bg="gray.700" borderRadius="md">
                    <Text color="white" fontWeight="bold">🧠 记忆</Text>
                    <Text color="gray.400" fontSize="sm">0 条记忆</Text>
                  </Box>
                  <Box p={4} bg="gray.700" borderRadius="md">
                    <Text color="white" fontWeight="bold">🔗 关系</Text>
                    <Text color="gray.400" fontSize="sm">0 个关系</Text>
                  </Box>
                  <Box p={4} bg="gray.700" borderRadius="md">
                    <Text color="white" fontWeight="bold">📦 产物</Text>
                    <Text color="gray.400" fontSize="sm">0 个产物</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
