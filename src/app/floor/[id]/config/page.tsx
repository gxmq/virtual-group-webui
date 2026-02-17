'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Heading, Text, Badge, SimpleGrid, Card, CardBody, Flex, Button, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, FormControl, FormLabel, Input, Switch, Select } from '@chakra-ui/react';

interface Floor {
  id: string;
  floor_no: number;
  display_name: string;
  company_name: string;
  status: string;
  timezone: string;
  floor_group: string;
}

export default function ConfigPage() {
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
            {floor?.display_name} - Config
          </Heading>
          <Text color="gray.400">{floor?.company_name} - 配置中心</Text>
        </Box>
        <Button colorScheme="gray" onClick={() => router.push(`/floor/${id}`)}>
          返回
        </Button>
      </Flex>

      <Tabs colorScheme="blue">
        <TabList>
          <Tab color="gray.400">公司</Tab>
          <Tab color="gray.400">Agent</Tab>
          <Tab color="gray.400">Trigger</Tab>
          <Tab color="gray.400">策略</Tab>
          <Tab color="gray.400">调度</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>🏢 公司配置</Heading>
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel color="gray.300">显示名称</FormLabel>
                    <Input value={floor?.display_name || ''} bg="gray.700" color="white" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.300">公司名称</FormLabel>
                    <Input value={floor?.company_name || ''} bg="gray.700" color="white" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.300">时区</FormLabel>
                    <Select value={floor?.timezone || 'Asia/Shanghai'} bg="gray.700" color="white">
                      <option value="Asia/Shanghai">Asia/Shanghai</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </Select>
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel color="gray.300" mb="0">启用楼层</FormLabel>
                    <Switch colorScheme="green" />
                  </FormControl>
                  <Button colorScheme="blue" alignSelf="flex-start">保存草稿</Button>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>🤖 Agent 配置</Heading>
                <Text color="gray.400">Agent 配置界面开发中...</Text>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>⚡ Trigger 配置</Heading>
                <Text color="gray.400">Trigger 配置界面开发中...</Text>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>📜 策略配置</Heading>
                <Text color="gray.400">策略配置界面开发中...</Text>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card bg="gray.800">
              <CardBody>
                <Heading size="md" color="white" mb={4}>⏰ 调度配置</Heading>
                <Text color="gray.400">调度配置界面开发中...</Text>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
