"use client"

import { useState } from "react"
import Image from "next/image"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CustomModal from "@/components/custommodal"
import useAddWooCommerce from "@/lib/mutation/integration/addwoocommerce"

// Schema for WooCommerce API credentials
const wooCommerceSchema = z.object({
  key: z.string().min(1, { message: "API Key is required" }),
  secret: z.string().min(1, { message: "API Secret is required" }),
  storeUrl: z.string().url({ message: "Valid Shop URL is required" }),
})

interface WooCommerceFormValues {
  storeUrl: string;
  key: string;  // Change this from consumerKey to key
  secret: string;  // Change this from consumerSecret to secret
}

// Available integrations
const integrations = [
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WooCommerce store",
    logo: "https://pbs.twimg.com/profile_images/1886747715024941056/9MrrEPpU_400x400.png", // Add your logo path
    status: "not_connected",
  },
]

export default function IntegrationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {mutate: addWooCommerce} = useAddWooCommerce()
  
  const form = useForm<WooCommerceFormValues>({
    resolver: zodResolver(wooCommerceSchema),
    defaultValues: {
      key: "",
      secret: "",
      storeUrl: "",
    },
  })

  const handleIntegrationClick = (integrationId: string) => {
    if (integrationId === "woocommerce") {
      setIsModalOpen(true)
    } else {
      toast.info("Coming soon", {
        description: "This integration will be available soon!",
      })
    }
  }

  const onSubmit = (values: WooCommerceFormValues) => {
    addWooCommerce({
      key: values.key,  // Updated to match the interface
      secret: values.secret,  // Updated to match the interface
      storeUrl: values.storeUrl,
    })
    setIsModalOpen(false)
    form.reset({
      key: "",
      secret: "",
      storeUrl: "",
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect your e-commerce platforms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card 
            key={integration.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              integration.status === "coming_soon" ? "opacity-70" : ""
            }`}
            onClick={() => handleIntegrationClick(integration.id)}
          >
            <CardContent className="flex items-center p-6">
              <div className="relative w-12 h-12 mr-4">
                <Image
                  src={integration.logo || "https://placehold.co/48x48"}
                  alt={integration.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{integration.name}</h3>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
              <div>
                {integration.status === "connected" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                ) : integration.status === "coming_soon" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Coming Soon
                  </span>
                ) : (
                  <Button size="sm" variant="outline">
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal for WooCommerce connection */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect WooCommerce"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={form.handleSubmit(onSubmit)}>Connect Store</Button>
          </div>
        }
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter your WooCommerce REST API credentials to connect your store.
            You can find these under WooCommerce &gt; Settings &gt; Advanced &gt; REST API.
          </p>
        </div>
        
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="storeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourshop.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="key"  // Updated from consumerKey
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="WooCommerce API Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secret"  // Updated from consumerSecret
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="WooCommerce API Secret" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <div className="mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Make sure you create an API key with read/write permissions.
            <a 
              href="https://woocommerce.com/document/woocommerce-rest-api/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Learn more
            </a>
          </p>
        </div>
      </CustomModal>
    </div>
  )
}