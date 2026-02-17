'use client';

import { useEffect, useState } from 'react';
import { Box, SimpleGrid, Text, Heading, Card, CardBody, Badge, Flex, Icon } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
  health_score: number;
  last_heartbeat_at: string | null;
  enabled: boolean;
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

export default function Home() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tower')
      .then(res => res.json())
      .then(data => {
        setFloors(data.floors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" p={8}>
        <Heading color="white" size="lg">Virtual Group Tower</Heading>
        <Text color="gray.400">加载中...</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900" p={8}>
      <Heading color="white" size="lg" mb={2}>
        Virtual Group Tower
      </Heading>
      <Text color="gray.400" mb={8}>
        6 层虚拟公司运营状态
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {floors.map((floor) => (
          <Card 
            key={floor.id} 
            bg="gray.800" 
            borderWidth="1px" 
            borderColor={floor.enabled ? 'green.500' : 'gray.700'}
            _hover={{ borderColor: 'blue.400' }}
            cursor="pointer"
          >
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" color="white">
                  {floor.display_name}
                </Heading>
                <Badge 
                  colorScheme={statusColors[floor.status] || 'gray'}
                  fontSize="sm"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {statusLabels[floor.status] || floor.status}
                </Badge>
              </Flex>
              
              <Text color="gray.300" fontSize="sm" mb={4}>
                {floor.company_name}
              </Text>

              <Flex justify="space-between" align="center">
                <Box>
                  <Text color="gray.500" fontSize="xs">
                    健康评分
                  </Text>
                  <Text 
                    color={floor.health_score > 70 ? 'green.400' : floor.health_score > 40 ? 'yellow.400' : 'red.400'} 
                    fontSize="2xl" 
                    fontWeight="bold"
                  >
                    {floor.health_score}%
                  </Text>
                </Box>
                <Box textAlign="right">
                  <Text color="gray.500" fontSize="xs">
                    最后心跳
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {floor.last_heartbeat_at 
                      ? new Date(floor.last_heartbeat_at).toLocaleString('zh-CN')
                      : 'N/A'
                    }
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Text color="gray.600" mt={8} textAlign="center" fontSize="sm">
        © 2026 Virtual Group - AI Agent Management System
      </Text>
    </Box>
  );
}
